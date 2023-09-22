provider "aws" {
  region = "us-east-1" # Specify your desired AWS region
}

resource "aws_vpc" "my_vpc_mqtt" {
  cidr_block = "11.0.0.0/16" # Replace with your desired CIDR block
}

resource "aws_subnet" "mqtt_subnet" {
  vpc_id                  = aws_vpc.my_vpc_mqtt.id
  cidr_block              = "11.0.1.0/24"  # Replace with your desired CIDR block
  availability_zone       = "us-east-1a"  # Replace with your desired availability zone
  map_public_ip_on_launch = true
}

# Create an Internet Gateway and attach it to the VPC
resource "aws_internet_gateway" "my_igw_mqqt" {
  vpc_id = aws_vpc.my_vpc_mqtt.id
}

# # # Create a Route Table for public subnet
resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.my_vpc_mqtt.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.my_igw_mqqt.id
  }
}

# # Associate the public subnet with the public route table
resource "aws_route_table_association" "public_subnet_association" {
  subnet_id      = aws_subnet.mqtt_subnet.id
  route_table_id = aws_route_table.public_route_table.id
}

# Define a security group for the EC2 instance
resource "aws_security_group" "ec2_security_group" {
  name        = "ec2-security-group"
  description = "Security group for the EC2 instance"
  vpc_id = aws_vpc.my_vpc_mqtt.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # Indicates all protocols
    cidr_blocks = ["0.0.0.0/0"] # Allow traffic to all IP addresses
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Adjust this to your trusted IP or CIDR block
  }

  # # Define inbound rule for port 6379 (Redis)
  ingress {
    from_port   = 1883
    to_port     = 1883
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "mqtt_broker" {
  instance_type = "t2.micro"             # Replace with your desired instance type
  key_name      = "my-local-2"
  ami = "ami-0793d6f1bd8ddb11c"
  subnet_id = aws_subnet.mqtt_subnet.id
  vpc_security_group_ids = [aws_security_group.ec2_security_group.id]

  tags = {
    Name = "MQTTBrokerInstance"
  }
}

resource "null_resource" "remote_exec" {
  triggers = {
    # You can add dependencies here if needed
    instance_id = aws_instance.mqtt_broker.id
  }

  # Use the provisioner to execute remote commands
  provisioner "remote-exec" {
    inline = [
      "sudo yum update -y",  # Update the package repository
      "sudo yum install -y mosquitto",  # Install Mosquitto MQTT broker
      "sudo systemctl start mosquitto",  # Start the Mosquitto service
      "sudo systemctl enable mosquitto",  # Enable Mosquitto to start on boot
    ]
    connection {
      type        = "ssh"
      user        = "ec2-user" # Change if using a different username
      private_key = "${file("~/.ssh/id_rsa")}"  # Replace with the path to your SSH private key
      host        = aws_instance.mqtt_broker.public_ip
    }
  }
}