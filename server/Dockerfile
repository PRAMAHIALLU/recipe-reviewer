FROM amr-registry.caas.intel.com/manufacturing-python/python:3.12-ubuntu24.04

# Install missing packages explicitly
RUN pip install --no-cache-dir flask flask-cors openpyxl

# Copy everything
COPY . .

EXPOSE 5000

CMD ["python", "app.py"]