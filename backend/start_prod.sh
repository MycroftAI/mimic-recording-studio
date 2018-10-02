gunicorn -w 4 -b 0.0.0.0:5000 app:app -c gunicorn_conf.py --capture-output
