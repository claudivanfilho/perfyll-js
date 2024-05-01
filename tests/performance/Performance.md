# Perfyll Performance in a Real JavaScript Application

## Benchmark in a server

```shell
autocannon -m POST http://localhost:4000/test
```

### Without Perfyll

|          | Stat    | 1%  | 2.5% | 50% | 97.5% | Avg   | Stdev | Min |
| -------- | ------- | --- | ---- | --- | ----- | ----- | ----- | --- |
| Run Nº 1 | Req/Sec | 617 | 617  | 770 | 817   | 751.4 | 58.83 | 617 |
| Run Nº 2 | Req/Sec | 658 | 658  | 736 | 778   | 728.5 | 34.27 | 658 |
| Run Nº 3 | Req/Sec | 718 | 718  | 752 | 776   | 748.8 | 14.7  | 718 |
| Run Nº 4 | Req/Sec | 584 | 584  | 731 | 755   | 720.1 | 48.98 | 584 |
| Run Nº 5 | Req/Sec | 712 | 712  | 720 | 742   | 723.5 | 9.95  | 712 |

### With Perfyll

|          | Stat    | 1%  | 2.5% | 50% | 97.5% | Avg   | Stdev | Min |
| -------- | ------- | --- | ---- | --- | ----- | ----- | ----- | --- |
| Run Nº 1 | Req/Sec | 618 | 618  | 754 | 831   | 756.4 | 58.25 | 618 |
| Run Nº 2 | Req/Sec | 742 | 742  | 765 | 830   | 778.4 | 28.79 | 742 |
| Run Nº 3 | Req/Sec | 749 | 749  | 773 | 820   | 779.1 | 20.05 | 749 |
| Run Nº 4 | Req/Sec | 636 | 636  | 757 | 785   | 747.9 | 40.84 | 636 |
| Run Nº 5 | Req/Sec | 612 | 612  | 774 | 852   | 772.5 | 68.11 | 612 |
| Run Nº 6 | Req/Sec | 737 | 737  | 765 | 827   | 768.7 | 24.01 | 737 |

## Benchmark Memory and CPU

### Using Node (0.0232ms of blocking time PER TRANSACTION)

```
For 10000 iterations and a process with delay of 0 milli
withMark = 12026ms
withoutMark = 11794ms
┌─────────────────────────┬────────────────────┬────────────────────┬──────────┐
│          label          │      withPerfyll   │    withoutPerfyl   │  result  │
├─────────────────────────┼────────────────────┼────────────────────┼──────────┤
│ memory.rss              │ 71.34375           │ 71.26953125        │ + 0.10%  │
│ memory.heapTotal        │ 18.3828125         │ 18.6328125         │ - 1.36%  │
│ memory.heapUsed         │ 11.060623168945312 │ 10.972679138183594 │ + 0.80%  │
│ memory.external         │ 2.197688102722168  │ 2.1853084564208984 │ + 0.57%  │
│ memory.rss.middle       │ 101.98828125       │ 101.60546875       │ + 0.38%  │
│ memory.heapTotal.middle │ 28.8828125         │ 20.3828125         │ + 41.70% │
│ memory.heapUsed.middle  │ 13.971542358398438 │ 10.055122375488281 │ + 38.95% │
│ memory.external.middle  │ 2.215190887451172  │ 2.1468658447265625 │ + 3.18%  │
│ cpu.user                │ 2701.028           │ 2674.099           │ + 1.01%  │
│ cpu.system              │ 671.911            │ 660.778            │ + 1.68%  │
│ memory.rss.final        │ 105.36328125       │ 105.16796875       │ + 0.19%  │
│ memory.heapTotal.final  │ 30.1328125         │ 28.6328125         │ + 5.24%  │
│ memory.heapUsed.final   │ 12.056144714355469 │ 13.475479125976562 │ - 11.77% │
│ memory.external.final   │ 2.1989974975585938 │ 2.146862030029297  │ + 2.43%  │
└─────────────────────────┴────────────────────┴────────────────────┴──────────┘
```

### Using Bun (0.0055ms of blocking time PER TRANSACTION)

```
For 10000 iterations and a process with delay of 0 milli
withMark = 68ms
withoutMark = 13ms
┌─────────────────────────┬───────────────────┬────────────────────┬───────────┐
│          label          │     withPerfyll   │    withoutPerfyl   │  result   │
├─────────────────────────┼───────────────────┼────────────────────┼───────────┤
│ memory.rss              │ 93.609375         │ 113.59375          │ - 21.35%  │
│ memory.heapTotal        │ 5.67578125        │ 5.5654296875       │ + 1.98%   │
│ memory.heapUsed         │ 4.233925819396973 │ 3.1315879821777344 │ + 35.20%  │
│ memory.external         │ 0                 │ 0                  │ Equal     │
│ memory.rss.middle       │ 102.171875        │ 116.484375         │ - 14.01%  │
│ memory.heapTotal.middle │ 11.50390625       │ 7.0166015625       │ + 63.95%  │
│ memory.heapUsed.middle  │ 4.233925819396973 │ 3.1315879821777344 │ + 35.20%  │
│ memory.external.middle  │ 0                 │ 0                  │ Equal     │
│ cpu.user                │ 74.863            │ 37.018             │ + 102.23% │
│ cpu.system              │ 32.119            │ 9.805              │ + 227.58% │
│ memory.rss.final        │ 113.484375        │ 121.28125          │ - 6.87%   │
│ memory.heapTotal.final  │ 18.72265625       │ 9.5947265625       │ + 95.13%  │
│ memory.heapUsed.final   │ 4.233925819396973 │ 3.1315879821777344 │ + 35.20%  │
│ memory.external.final   │ 0                 │ 0                  │ Equal     │
└─────────────────────────┴───────────────────┴────────────────────┴───────────┘
```
