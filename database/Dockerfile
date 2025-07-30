# Use official MySQL image
FROM mysql:8.0

# Set environment variables
ENV MYSQL_ROOT_PASSWORD=bankingsystem2024
ENV MYSQL_DATABASE=bank
ENV MYSQL_USER=bankuser
ENV MYSQL_PASSWORD=bankingsystem2024

# Copy initialization scripts
COPY schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY seed.sql /docker-entrypoint-initdb.d/02-seed.sql

# Expose MySQL port
EXPOSE 3306

# Set MySQL configuration
RUN echo '[mysqld]' > /etc/mysql/conf.d/custom.cnf && \
    echo 'bind-address = 0.0.0.0' >> /etc/mysql/conf.d/custom.cnf && \
    echo 'max_connections = 100' >> /etc/mysql/conf.d/custom.cnf