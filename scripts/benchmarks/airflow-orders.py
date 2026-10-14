"""Local dag.test adapter. Test endpoint and Airflow home are supplied by the runner."""
import json
import os
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from airflow.sdk import DAG, task

@task(retries=0)
def process_orders():
    url = os.environ['BENCHMARK_ENDPOINT']
    with urllib.request.urlopen(url + '/input', timeout=3) as response:
        payload = json.load(response)
    settings = payload['settings']
    for order in payload['orders']:
        if order.get('approved') is not True:
            continue
        body = json.dumps({'id': order['id'], 'amount': order['amount']}).encode()
        for attempt in range(settings['maxAttempts']):
            try:
                request = urllib.request.Request(url + '/write', data=body, headers={'Content-Type': 'application/json'})
                with urllib.request.urlopen(request, timeout=settings['requestTimeoutMs']/1000) as response:
                    json.load(response)
                break
            except (urllib.error.URLError, TimeoutError):
                if attempt + 1 == settings['maxAttempts']:
                    raise
                time.sleep(settings['retryDelayMs']/1000)

with DAG('benchmark_orders', start_date=datetime(2025, 1, 1, tzinfo=timezone.utc), schedule=None, catchup=False) as dag:
    process_orders()

if __name__ == '__main__':
    run = dag.test()
    print('BENCHMARK_COMPLETED=' + str(run.state == 'success').lower())
    raise SystemExit(0 if run.state == 'success' else 1)
