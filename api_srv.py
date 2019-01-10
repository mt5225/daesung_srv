# -*- coding: utf-8 -*-
#############################
# pip install pymysql
# curl -i -X GET http://localhost:9006/alarms
# curl -i -X GET http://localhost:9006/path
# all ararms are stored in one mysql talbe named alarms
#############################
import logging
import sys
from flask import Flask, jsonify
from logging.handlers import RotatingFileHandler
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from types import NoneType
from datetime import datetime, timedelta
import pandas as pd

_DB_URL = 'mysql+pymysql://root@127.0.0.1/hds'
#_DB_URL = 'mysql+pymysql://root:1234@55.60.106.53/momoda'

# innit flash app and backend db connection
app = Flask(__name__, static_url_path='', static_folder='static')

app.config['SQLALCHEMY_BINDS'] = {
    'alarms': _DB_URL
}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# init lookup map
_CCTV_LOOKUP = pd.read_csv('cctv_mapping.csv', dtype={'ID': object})

# init DB
_DB = SQLAlchemy(app)

@app.route('/')
def index():
    return jsonify(msg='Hello, HDS!'), 200

@app.route('/alarms', methods=['GET'])
def alarms():
    msg_array = []
    engine = _DB.get_engine(bind='alarms')
    today_str = datetime.now().strftime("%Y-%m-%d")
    yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    q_str = "SELECT occurrences,sensor,msg FROM alarms where locate('%s', occurrences)>0 OR locate('%s', occurrences)>0" % (today_str, yesterday_str)
    result = engine.execute(q_str)
    for row in result:
        sensor_id = row[1]
        app.logger.debug("look for cctv info of sensor %s" % sensor_id)
        cctv_df = _CCTV_LOOKUP.loc[_CCTV_LOOKUP['ID'] == sensor_id]
        if len(cctv_df.index > 0):
            cctv_info = "%s" % (cctv_df.iloc[0].CCTV1)
            status = row[2]
            msg_array.append("%s|%s|%s|%s"% (row[0], status,row[1], cctv_info))
    app.logger.debug(msg_array)
    msg_short = '#'.join(msg_array) if msg_array > 0 else ""
    return msg_short, 200

@app.route('/path')
def path():
    msg_array = []
    with open('patrol.txt') as fp:
       for line in fp:
           if len(line.strip()) > 2: msg_array.append(line.strip()) 
    app.logger.debug(msg_array)
    msg_short = '#'.join(msg_array) if msg_array > 0 else ""
    return msg_short, 200

if __name__ == '__main__':
    LOG_FILENAME = './hds_api_srv.log'
    formatter = logging.Formatter(
        "[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    CORS(app)
    app.run(host='0.0.0.0', port=9006, debug=True, threaded=True)