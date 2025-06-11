import boto3
import uuid
import json
import os

s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'app-autofill-resumes')
UPLOAD_FOLDER = ''

def lambda_handler(event, context):
    method = event.get('httpMethod', '')
    if method=='OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'OPTIONS,GET' }, 'body': ''}
    # Generate a unique key for the resume
    resume_id = str(uuid.uuid4())
    object_key = f"{resume_id}.pdf"

    # Generate the pre-signed URL
    presigned_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': BUCKET_NAME,
            'Key': object_key,
            'ContentType': 'application/pdf'
        },
        ExpiresIn=300  # URL valid for 5 minutes
    )

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # Adjust for CORS needs
        },
        'body': json.dumps({
            'uploadUrl': presigned_url,
            'fileKey': object_key
        })
    }
