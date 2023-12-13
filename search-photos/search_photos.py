import json
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
import boto3

# Opensearch settings
host = 'vpc-photoscc3-lcmxnrk5m4p55kzg6aet3fhsnq.us-east-1.es.amazonaws.com'
region = 'us-east-1'
service = 'es'
credentials = boto3.Session().get_credentials()
auth = AWSV4SignerAuth(credentials, region, service)

# Load S3 and Rekognition clients
s3_client = boto3.client('s3')
rekognition_client = boto3.client('rekognition')

def lambda_handler(event, context):
    # Opensearch setup
    os_client = OpenSearch(
    hosts = [{'host': host, 'port': 443}],
    http_auth = auth,
    use_ssl = True,
    verify_certs = True,
    connection_class = RequestsHttpConnection,
    pool_maxsize = 20
    )

    # Extract query parameter
    query = event['queryStringParameters']['q']

    # Elasticsearch query
    search_body = {
        "query": {
            "match": {
                "labels": query
            }
        }
    }

    # Perform the search
    response = os_client.search(index="photos", body=search_body)

    # Extract and return results
    results = [doc['_source'] for doc in response['hits']['hits']]
    
    return {
        'statusCode': 200,
        'body': json.dumps(results)
    }


# {'dialogAction': {'type': 'Close'}, 
#  'intent': {'name': 'SearchIntent', 'slots': {'keyslot1': {'value': {'originalValue': 'cats', 'interpretedValue': 'cats', 'resolvedValues': ['Cats']}}, 'keyslot2': None}, 'state': 'ReadyForFulfillment', 'confirmationState': 'None'},
#    'sessionAttributes': {}, 
#    'originatingRequestId': 'abdded76-5e2f-4b20-a1d6-219aff0f7c15'}