import json
import boto3 # Python library to access aws services
import dateutil.parser as parser
import os
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
import base64

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
    
    # From the S3 Event message structure Get bucket and file name
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    print(bucket)
    print(key)
    
    # Labels List
    LabelsList = []
    
    # Fetch S3 object
    base64_string = s3_client.get_object(Bucket = bucket, Key = key)
    base64_stream = base64_string['Body'].read()
    base_64_binary = base64.decodebytes(base64_stream)
    

    # Fetch Object Metadata
    ObjectMetaData = s3_client.head_object(Bucket = bucket, Key = key)
    print(ObjectMetaData)
    
    # Append labels to LabelsList if any custom labels are present
    if "x-amz-meta-customlabels" in ObjectMetaData['ResponseMetadata']['HTTPHeaders']:
        LabelsList.append(ObjectMetaData['ResponseMetadata']['HTTPHeaders']['x-amz-meta-customlabels'])
        
    # Detect labels using AWS Rekognition
    response = rekognition_client.detect_labels(Image = {"Bytes": base_64_binary})
    print(response)

    for Label in response['Labels']:
        LabelsList.append(Label['Name'])
    
    print(LabelsList)
    
    elastic_json = {}
    elastic_json["objectKey"] = key
    elastic_json["bucket"] = bucket
    elastic_json["createdTimestamp"] = ObjectMetaData['LastModified'].isoformat() #Convert into ISO 8601 
    elastic_json["labels"] = LabelsList
    
    print(elastic_json)
    
    # Index the document in Opensearch
    os_client.index(index="photos", id=key, body=elastic_json, refresh = True)
    
    return {
        'statusCode': 200,
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",  # Specify the allowed headers
            "Access-Control-Allow-Methods": "*",  # Specify the allowed HTTP methods
        },
        'body': json.dumps('Image indexed successfully!')
    }
    
    


    

