import React, { useState, useRef, useEffect } from 'react';
import './RecipeAuditForm.css';

const RecipeAuditForm = () => {
  const initialFormData = {
    platform: '',
    chamberRecipeFile: null,
    lpcRecipeFile: null,
    seasoningRecipeFile: null,
    midLotRecipeFile: null,
    cleaningRecipeFile: null,
    parameterFile: null,
    chamberOfInterest: '',
    escCip: '',
    cip: '',
    processLogFile1: null,
    processLogFile2: null,
    processLogFile3: null,
    processLogFile4: null
  };

  // Options for dropdown menus
  const platformOptions = [
    { value: '', label: 'Select Platform' },
    { value: 'GTA-TAO', label: 'GTA-TAO' },
    { value: 'GTO-TVO', label: 'GTO-TVO' },
    { value: 'GTT', label: 'GTT' },
    { value: 'GTX-ONT', label: 'GTX-ONT' },
    { value: 'GNT-ANT', label: 'GNT-ANT' }
  ];

  const chamberOptions = [
    { value: '', label: 'Select Chamber' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '7', label: '7' },
    { value: '8', label: '8' }
  ];

  const cipOptions = [
    { value: '', label: 'Select CIP' },
    { value: 'CIP5', label: 'CIP5' },
    { value: 'CIP6', label: 'CIP6' },
    { value: 'CIP7', label: 'CIP7' },
    { value: 'Other-contact Nick Anderson', label: 'Other-contact Nick Anderson' }
  ];

  const escCipOptions = [
    { value: '', label: 'Select ESC CIP' },
    { value: 'CIP5', label: 'CIP 5' },
    { value: 'CIP7-SMZ', label: 'CIP7-SMZ' },
    { value: 'Other-contact Nick Anderson', label: 'Other-contact Nick Anderson' }
  ];

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingResults, setProcessingResults] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  
  // Refs for auto-scrolling
  const resultsRef = useRef(null);
  const formRef = useRef(null);

  // Function to download Excel file from base64 data
  const downloadExcelFile = (base64Data, filename) => {
    try {
      // Convert base64 to binary data
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      
      // Create blob with Excel MIME type
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'ERB_Macro_Output.xlsx';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Excel file downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading Excel file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    // Debug logging to see what's happening
    console.log('Input change event:', {
      name,
      value,
      files,
      filesLength: files ? files.length : 0,
      firstFile: files ? files[0] : null,
      firstFileName: files && files[0] ? files[0].name : null
    });
    
    const newValue = files ? (files.length > 0 ? files[0] : null) : value;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      
      // Debug the state update
      console.log('FormData update:', {
        fieldName: name,
        newValue: newValue,
        updatedFormData: updated
      });
      
      return updated;
    });

    // Clear error when user makes changes to fix validation issues
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Custom validation for required fields
    const requiredFields = {
      platform: 'Platform',
      chamberOfInterest: 'Chamber of Interest', 
      escCip: 'ESC CIP',
      cip: 'CIP',
      chamberRecipeFile: 'Chamber Recipe File'
    };
    
    const missingFields = [];
    
    // Check required text fields
    if (!formData.platform) missingFields.push('Platform');
    if (!formData.chamberOfInterest) missingFields.push('Chamber of Interest');
    if (!formData.escCip) missingFields.push('ESC CIP');
    if (!formData.cip) missingFields.push('CIP');
    
    // Check required file fields
    if (!formData.chamberRecipeFile || !(formData.chamberRecipeFile instanceof File)) {
      missingFields.push('Chamber Recipe File');
    }
    
    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Auto-scroll to top when form is submitted
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }, 100);
    
    setIsSubmitting(true);
    setError(null);
    setSubmitResult(null);
    setProcessingResults(null);
    setUploadProgress(0);
    setProcessingStep('Preparing files...');

    try {
      // Create FormData object for file uploads
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('platform', formData.platform);
      formDataToSend.append('chamber', formData.chamberOfInterest);
      formDataToSend.append('escCip', formData.escCip);
      formDataToSend.append('cip', formData.cip);

      // Add file fields (only if files are selected)
      const fileFields = [
        'chamberRecipeFile',
        'lpcRecipeFile', 
        'seasoningRecipeFile',
        'midLotRecipeFile',
        'cleaningRecipeFile',
        'parameterFile',
        'processLogFile1',
        'processLogFile2',
        'processLogFile3',
        'processLogFile4'
      ];

      fileFields.forEach(fieldName => {
        if (formData[fieldName]) {
          formDataToSend.append(fieldName, formData[fieldName]);
        }
      });
      
      setProcessingStep('Uploading files...');
      setUploadProgress(25);

      // Make API call
      const response = await fetch('http://127.0.0.1:5000/api/process', {
        method: 'POST',
        body: formDataToSend,
      });
      
      setProcessingStep('Processing recipes...');
      setUploadProgress(50);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Full API response: ', JSON.stringify(result, null, 2));
      
      setProcessingStep('Analyzing results...');
      setUploadProgress(75);

      // Check if the API call was successful
      if (result.status === 'success') {
        const processingData = result.data;
        
        // Store processing results for display
        setProcessingResults(processingData);
        
        // Enhanced Excel file handling with better error checking
        console.log('Checking for Excel data in response...');
        console.log('Processsing Data:', processingData.excel_result)
        console.log('Processing data structure:', Object.keys(processingData || {}));
        
        if (processingData?.excel_result?.excel_file) {
          console.log('Excel file found, initiating download...');
          console.log('Excel filename:', processingData.excel_result.filename);
          console.log('Excel data length:', processingData.excel_result.excel_file.length);
          
          // Automatically download the Excel file
          downloadExcelFile(
            processingData.excel_result.excel_file, 
            processingData.excel_result.filename || 'ERB_Analysis_Results.xlsx'
          );
          
          // Log processing statistics
          const stats = processingData.excel_result;
          console.log('📊 Analysis Statistics:');
          console.log(`- Total Flags: ${stats.total_flags || 'N/A'}`);
          console.log(`- Failing Flags: ${stats.failing_flags || 'N/A'}`);
          console.log(`- LPC Flags: ${stats.lpc_flags || 'N/A'}`);
        } else {
          console.warn('⚠️ No Excel file found in response');
          console.log('Available result keys:', Object.keys(processingData || {}));
        }
        
        setProcessingStep('Generating report...');
        setUploadProgress(100);
        setSubmitResult('success');
        
      } else {
        throw new Error(result.message || 'Processing failed');
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error submitting form:', err);
      setProcessingStep('Error occurred');
    } finally {
      setIsSubmitting(false);
      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
        setProcessingStep('');
      }, 2000);
    }
  };

  const handleDownloadAgain = () => {
    if (processingResults?.excel_result?.excel_file) {
      downloadExcelFile(
        processingResults.excel_result.excel_file,
        processingResults.excel_result.filename
      );
    }
  };

  const handleFileDeselect = (fieldName, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Deselecting file:', fieldName);
    
    // Clear the actual file input element first
    const fileInput = document.getElementById(fieldName);
    if (fileInput) {
      fileInput.value = '';
      console.log('Cleared file input value for:', fieldName);
    }
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [fieldName]: null
      };
      console.log('File deselected, updated formData:', updated);
      return updated;
    });
  };

  const handleReset = () => {
    // Reset form data
    setFormData(initialFormData);
    setSubmitResult(null);
    setError(null);
    setProcessingResults(null);
    setUploadProgress(0);
    setProcessingStep('');
    
    // Reset file inputs by clearing their values
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.value = '';
    });
    
    // Force a re-render by updating state
    setTimeout(() => {
      setFormData({...initialFormData});
    }, 10);
  };

  const FileInput = ({ name, label, accept = ".txt,.csv,.json,.xml,.recipe", required = false }) => {
    // More robust file checking
    const hasFile = formData[name] && 
                   formData[name] instanceof File && 
                   formData[name].name && 
                   formData[name].name.trim() !== '';
    
    // Check if this required field is missing (for styling)
    const isMissingRequired = required && !hasFile;
    
    // Debug logging for file state
    console.log(`FileInput ${name}:`, {
      formDataValue: formData[name],
      hasFile: hasFile,
      isFile: formData[name] instanceof File,
      fileName: formData[name]?.name,
      required: required,
      isMissingRequired: isMissingRequired
    });
    
    return (
      <div className="form-group">
        <label htmlFor={name}>{label}{required && <span className="required-asterisk"> *</span>}</label>
        <div className="file-input-container">
          <div className="custom-file-input-wrapper">
            <input
              type="file"
              id={name}
              name={name}
              onChange={handleInputChange}
              accept={accept}
              disabled={isSubmitting}
              // Remove required attribute - we'll handle validation manually
            />
            <div className={`custom-file-button ${hasFile ? 'has-file' : ''} ${isMissingRequired ? 'missing-required' : ''} ${isSubmitting ? 'disabled' : ''}`}>
              <span className={`file-button-text ${hasFile ? '' : 'placeholder'}`}>
                {hasFile ? `Selected: ${formData[name].name}` : 'Choose file...'}
              </span>
              <span className="file-button-icon">
                {hasFile ? '✓' : '📁'}
              </span>
            </div>
          </div>
          {hasFile && !isSubmitting && (
            <button
              type="button"
              className="external-deselect-btn"
              onClick={(e) => handleFileDeselect(name, e)}
              title="Remove selected file"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    );
  };

  const SelectInput = ({ name, label, options, required = false }) => (
    <div className="form-group">
      <label htmlFor={name}>{label}{required && <span className="required-asterisk"> *</span>}</label>
      <select
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        disabled={isSubmitting}
        required={required}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Enhanced Results Display Component
  const ProcessingResults = () => {
    if (!processingResults) return null;

    const excelData = processingResults.excel_result;
    console.log('Rendering Processing Results with data:', excelData.total)
    const hasExcelFile = excelData?.excel_file;

    return (
      <div className="processing-results" ref={resultsRef}>
        <h3>
          ✅ Processing Complete!
        </h3>
        
        {/* Analysis Statistics */}
        {excelData && (
          <div className="analysis-summary">
            <h4>📊 Analysis Summary</h4>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number total">
                  {excelData.total_flags || 0}
                </div>
                <div className="stat-label">Total Flags</div>
              </div>
              <div className="stat-card">
                <div className="stat-number failing">
                  {excelData.failing_flags || 0}
                </div>
                <div className="stat-label">Failing Flags</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Failing Flags Detail Table */}
        {excelData && excelData.flags_summary && excelData.flags_summary.length > 0 ? (
          <div className="analysis-summary">
            <h4>🚨 Failing Flags Detail ({excelData.flags_summary.length} items)</h4>
            <div className="flags-table-container">
              <table className="flags-table">
                <thead>
                  <tr>
                    {/* Preserve original column order from raw data */}
                    {Object.keys(excelData.flags_summary[0]).map((key) => {
                      // Debug: log the column order
                      console.log('Column order:', Object.keys(excelData.flags_summary[0]));
                      return (
                        <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {excelData.flags_summary.map((row, index) => {
                    const flagStatus = (row.Flag || '').toLowerCase();
                    return (
                      <tr key={index} className={`flag-row ${flagStatus}`}>
                        {/* Maintain same column order as header */}
                        {Object.keys(excelData.flags_summary[0]).map((key) => {
                          const value = row[key];
                          return (
                            <td key={key} className={`flag-${key.toLowerCase().replace(/ /g, '-')}-cell`}>
                              {key === 'Flag' ? (
                                <span className={`flag-status-badge ${flagStatus}`}>
                                  {value || 'Unknown'}
                                </span>
                              ) : (
                                <span>
                                  {value === null || value === undefined || value === 'NaN' ? 
                                    <em style={{color: '#999'}}>N/A</em> : 
                                    String(value)
                                  }
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : excelData && excelData.failing_flags === 0 ? (
          <div className="no-failing-flags">
            <p>🎉 Excellent! No failing flags detected in your analysis.</p>
          </div>
        ) : null}
        
        {/* Download Section */}
        {hasExcelFile && (
          <div className="download-section">
            <button 
              onClick={handleDownloadAgain}
              className="download-btn"
            >
              📥 Download Excel Report
            </button>
            {excelData.filename && (
              <div className="download-info">
                File: {excelData.filename}
              </div>
            )}
          </div>
        )}
        
        {/* Configuration Details */}
        <div className="config-details">
          <h4>⚙️ Processing Configuration:</h4>
          <div className="config-card">
            <div className="config-grid">
              <div className="config-item">
                <strong>Platform:</strong> {formData.platform || 'Not specified'}
              </div>
              <div className="config-item">
                <strong>Chamber:</strong> {formData.chamberOfInterest || 'Not specified'}
              </div>
              <div className="config-item">
                <strong>ESC CIP:</strong> {formData.escCip || 'Not specified'}
              </div>
              <div className="config-item">
                <strong>CIP:</strong> {formData.cip || 'Not specified'}
              </div>
            </div>
            
            {/* File Upload Summary */}
            <div className="files-section">
              <strong>📁 Uploaded Files:</strong>
              <div className="files-grid">
                {[
                  { file: formData.chamberRecipeFile, label: 'Chamber Recipe' },
                  { file: formData.parameterFile, label: 'Parameters' },
                  { file: formData.lpcRecipeFile, label: 'LPC Recipe' },
                  { file: formData.seasoningRecipeFile, label: 'Pre-Lot Recipe' },
                  { file: formData.midLotRecipeFile, label: 'Mid-Lot Recipe' },
                  { file: formData.cleaningRecipeFile, label: 'Post-Lot Recipe' },
                  { file: formData.processLogFile1, label: 'Process Log 1' },
                  { file: formData.processLogFile2, label: 'Process Log 2' },
                  { file: formData.processLogFile3, label: 'Process Log 3' },
                  { file: formData.processLogFile4, label: 'Process Log 4' }
                ].filter(item => item.file).map((item, index) => (
                  <div key={index} className="file-item">
                    <strong>{item.label}:</strong> {item.file.name}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Processing Timestamp */}
            <div className="timestamp">
              Processed: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Status Indicator */}
        {!hasExcelFile && (
          <div className="warning-message">
            ⚠️ Processing completed but no Excel file was generated. Check the console for details.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="process-config-form" ref={formRef}>
      <h2>Recipe Analysis & Audit Tool</h2>
      
      {/* Progress Indicator */}
      {isSubmitting && (
        <div className="progress-container">
          <div className="progress-header">
            <span className="progress-text">
              {processingStep || 'Processing...'}
            </span>
            <span className="progress-percentage">{uploadProgress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Processing Results Display */}
      <ProcessingResults />

      <form onSubmit={handleSubmit}>
        {/* Platform Section */}
        <div className="form-section">
          <h3>Platform Information</h3>
          <SelectInput 
            name="platform" 
            label="Platform" 
            options={platformOptions} 
            required={true}
          />
          
          <SelectInput 
            name="chamberOfInterest" 
            label="Chamber of Interest" 
            options={chamberOptions} 
            required={true}
          />
        </div>

        {/* Recipe Files Section */}
        <div className="form-section">
          <h3>Recipe Files</h3>
          <FileInput name="chamberRecipeFile" label="Chamber Recipe" required={true} />
          <FileInput name="parameterFile" label="Tools Parameters" accept=".txt,.csv,.json,.xml,.params" />
          <FileInput name="lpcRecipeFile" label="LPC Recipe File" />
          <FileInput name="seasoningRecipeFile" label="Pre-Lot Recipe" />
          <FileInput name="midLotRecipeFile" label="Mid-Lot Recipe" />
          <FileInput name="cleaningRecipeFile" label="Post-Lot Recipe" />
        </div>

        {/* CIP Section */}
        <div className="form-section">
          <h3>CIP Configuration</h3>
          <SelectInput 
            name="escCip" 
            label="ESC CIP" 
            options={escCipOptions} 
            required={true}
          />

          <SelectInput 
            name="cip" 
            label="CIP" 
            options={cipOptions} 
            required={true}
          />
        </div>

        {/* Process Log Files Section */}
        <div className="form-section">
          <h3>Process Log Files</h3>
          <FileInput name="processLogFile1" label="Process Log File 1" accept=".log,.txt,.csv,.json" />
          <FileInput name="processLogFile2" label="Process Log File 2" accept=".log,.txt,.csv,.json" />
          <FileInput name="processLogFile3" label="Process Log File 3" accept=".log,.txt,.csv,.json" />
          <FileInput name="processLogFile4" label="Process Log File 4" accept=".log,.txt,.csv,.json" />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '⏳ Processing...' : '🚀 Submit'}
          </button>
          <button 
            type="button" 
            onClick={handleReset} 
            className="btn-secondary"
            disabled={isSubmitting}
          >
            🔄 Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeAuditForm;