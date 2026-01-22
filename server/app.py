import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import csv
import tempfile
import os
import io
import json
from datetime import datetime
from werkzeug.utils import secure_filename

#from process_script import process_recipe_data  # Import your processing function

app = Flask(__name__)
CORS(app)

OR_ANALYSIS_PATH = r'\\ORSHFS.intel.com\ORAnalysis$\PMFG_MAODATA\Config\ETCH\modeling_team\script_archive\recipe_reviewer'
sys.path.append(OR_ANALYSIS_PATH)

from ParseRecipeData import process_recipe_data

@app.route('/api/process', methods=['POST'])
def process():
    try:
        print("=== Starting process endpoint ===")
        
        # Get form data
        form_data = request.form.to_dict()
        print(f"Form data received: {form_data}")
        
        # Debug: Print received files
        print("Files received:", list(request.files.keys()))
        
        # Get file data
        files_data = {}
        for field_name, file in request.files.items():
            print(f"Processing: {field_name} - {file.filename}")
            
            if file.filename.endswith('.csv'):
                try:
                    # Reset file pointer to beginning
                    file.seek(0)
                    
                    # Read raw bytes first
                    raw_content = file.read()
                    print(f"Raw content length for {field_name}: {len(raw_content)} bytes")
                    
                    # Try different encodings
                    csv_content = None
                    encodings_to_try = ['utf-8', 'windows-1252', 'latin-1', 'iso-8859-1']
                    
                    for encoding in encodings_to_try:
                        try:
                            csv_content = raw_content.decode(encoding)
                            print(f"Successfully decoded {field_name} with {encoding}")
                            break
                        except UnicodeDecodeError:
                            continue
                    
                    if csv_content is None:
                        # If all encodings fail, use latin-1 (it accepts any byte)
                        csv_content = raw_content.decode('latin-1', errors='replace')
                        print(f"Used latin-1 with error replacement for {field_name}")
                    
                    print(f"Content length for {field_name}: {len(csv_content)}")
                    
                    csv_reader = csv.reader(io.StringIO(csv_content))
                    csv_data = list(csv_reader)
                    files_data[field_name] = csv_data
                    
                    print(f"Successfully parsed {field_name}: {len(csv_data)} rows")
                    
                except Exception as e:
                    print(f"Error processing {field_name}: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    # Reset file pointer and try raw read
                    file.seek(0)
                    raw_content = file.read()
                    files_data[field_name] = raw_content.decode('latin-1', errors='replace')
            else:
                # Read other files as text
                file.seek(0)
                raw_content = file.read()
                try:
                    files_data[field_name] = raw_content.decode('utf-8')
                except UnicodeDecodeError:
                    files_data[field_name] = raw_content.decode('latin-1', errors='replace')
        
        print(f"Files processed successfully. Total files: {len(files_data)}")
        
        # Process the recipe data
        print("=== Calling process_recipe_data ===")
        try:
            result = process_recipe_data(files_data, form_data)
            print("=== process_recipe_data completed successfully ===")
        except Exception as e:
            print(f"ERROR in process_recipe_data: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'error': f'Processing failed: {str(e)}',
                'traceback': traceback.format_exc()
            }), 500
        
        # Prepare data to save
        result_data = {
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            #"form_data": form_data,
            #"files_data": files_data,
            "processing_result": result
        }

        # Print Result Data
        print("Result ")
        
        # Save to JSON file
        try:
            save_results_to_file(result_data)
        except Exception as e:
            print(f"Warning: Could not save results to file: {str(e)}")
        
        return jsonify({
            "status": "success",
            "message": "Files processed successfully!",
            "data": result
        })
        
    except Exception as e:
        print(f"=== OVERALL ERROR ===")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

def save_results_to_file(data):
    """Save results to a JSON file with timestamp"""
    try:
        # Create results directory if it doesn't exist
        results_dir = "results"
        if not os.path.exists(results_dir):
            os.makedirs(results_dir)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{results_dir}/processing_results_{timestamp}.json"
        
        # Save to JSON file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Results saved to: {filename}")
        
    except Exception as e:
        print(f"Error saving results: {str(e)}")

if __name__ == '__main__':
    app.run(debug=True)

