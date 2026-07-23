SELECT 'CREATE DATABASE wepost_test OWNER wepost'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'wepost_test')\gexec
