import os
import time
import requests
import smtplib
from email.mime.text import MIMEText
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')
print(f"🔍 MONGO_URI: {MONGO_URI}") 

# Email Configuration
EMAIL_SENDER = 'jimparado042@gmail.com'
EMAIL_PASSWORD = 'fbsp dung ziol ptxw'
EMAIL_RECIPIENT = 'jimparado042@gmail.com'

# ✅ FIXED: Added SSL options
client = MongoClient(MONGO_URI, tls=True, tlsAllowInvalidCertificates=True)

# ✅ FIXED: Gamitin ang bagong database name
db = client['kingx_uptime_v2']
print(f"🔍 Database: {db.name}")

users_collection = db['users']
history_collection = db['histories']

last_status = {}

def send_alert(url, status):
    subject = f"🚨 Uptime Alert: {url} is {status.upper()}"
    body = f"Website {url} is now {status} at {datetime.utcnow()}."
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = EMAIL_SENDER
    msg['To'] = EMAIL_RECIPIENT
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, [EMAIL_RECIPIENT], msg.as_string())
        print(f"📧 Alert sent for {url}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

def check_website(url):
    start_time = time.time()
    try:
        response = requests.get(url, timeout=10)
        end_time = time.time()
        response_time = int((end_time - start_time) * 1000)
        status = 'up' if response.status_code == 200 else 'down'
        return status, response_time
    except:
        return 'down', None

def save_history(user_id, url, status, response_time):
    history_collection.insert_one({
        'userId': user_id,
        'url': url,
        'status': status,
        'responseTime': response_time,
        'timestamp': datetime.utcnow(),
        'duration': 0
    })

def update_status_and_history(url, status, response_time):
    users = users_collection.find({'websites.url': url})
    for user in users:
        for site in user['websites']:
            if site['url'] == url:
                site['status'] = status
                site['lastChecked'] = datetime.utcnow()
                users_collection.update_one(
                    {'_id': user['_id']},
                    {'$set': {'websites': user['websites']}}
                )
        save_history(user['_id'], url, status, response_time)
    print(f"[{datetime.utcnow()}] {url} -> {status} ({response_time}ms)")

def monitor_loop():
    print("🔄 Monitor started. Checking every 60 seconds...")
    while True:
        all_users = users_collection.find()
        urls = set()
        for user in all_users:
            for site in user.get('websites', []):
                urls.add(site['url'])
        for url in urls:
            status, response_time = check_website(url)
            update_status_and_history(url, status, response_time)
            if status == 'down':
                send_alert(url, status)
        time.sleep(60)

if __name__ == '__main__':
    monitor_loop()