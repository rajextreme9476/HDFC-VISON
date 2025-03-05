// src/pages/GenerateBRD.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mammoth from 'mammoth'; // For reading .doc files
import './GenerateBRD.css';

const GenerateBRD: React.FC = () => {
  const navigate = useNavigate();
  const [meetingTranscript, setMeetingTranscript] = useState('');
  const [conceptNote, setConceptNote] = useState<File | null>(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedBRD, setGeneratedBRD] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Replace with your Gemini AI API key
  const GEMINI_API_KEY = 'AIzaSyC35nTY2y-ospXRdM_9bywBreQiIO1jF7w';

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setConceptNote(e.target.files[0]);
    }
  };

  // Trigger file input click when "Browse Files" is clicked
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Call Gemini AI API to generate BRD
  const generateBRD = async () => {
    setLoading(true);
    try {
      // Prepare the prompt for Gemini AI
      let prompt = `Create a Business Requirements Document (BRD) based on the following inputs:\n\n`;
      prompt += `Meeting Transcript:\n${meetingTranscript}\n\n`;
      prompt += `Additional Context:\n${additionalContext}\n\n`;

      if (conceptNote) {
        // Read the .doc file using mammoth.js
        const arrayBuffer = await conceptNote.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const conceptNoteText = result.value; // Extracted text from .doc file
        prompt += `Concept Note:\n${conceptNoteText}\n\n`;
      }

      prompt += `Please generate a detailed BRD with sections for Project Objective, Requirements, Project Scope, and Key Stakeholders.`;

      // Call Gemini AI API (example endpoint and structure)
/*       const response = await fetch('https://api.gemini.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }); */

  
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      ); 
      
/*       const response = await fetch('http://localhost:5000/api/generate-brd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      }); */
      
  
      const data = await response.json();
      const brdText = data.generated_text || 'Failed to generate BRD content.';
      setGeneratedBRD(brdText);

      // Automatically download the BRD as a .doc file
      downloadBRDAsDoc(brdText);
    } catch (error) {
      console.error('Error generating BRD:', error);
      setGeneratedBRD('Error: Unable to generate BRD '+error);
    } finally {
      setLoading(false);
    }
  };

  // Generate and download the BRD as a .doc file
  const downloadBRDAsDoc = (brdText: string) => {
    // Create a simple HTML structure for the .doc file
    const docContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Business Requirements Document</title>
        <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { font-size: 24px; color: #333; }
          h3 { font-size: 18px; color: #333; }
          p, li { font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Business Requirements Document</h1>
        ${brdText.replace(/\n/g, '<br>')}
      </body>
      </html>
    `;

    // Create a Blob with the .doc content
    const blob = new Blob([docContent], { type: 'application/msword' });

    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Business_Requirements_Document.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="generate-brd">
      {/* Input Details Section */}
      <section className="input-details">
        <div className="section-header">
          <div className="header-logo-title">
            <img src="/hdfc-logo.png" alt="HDFC Vision" className="header-logo" />
            <h2>Generate BRD - Input Details</h2>
          </div>
          <button className="profile-button">
            <span className="profile-initials">JS</span>
          </button>
        </div>
        <p className="instructions">
          Please provide the necessary information to generate your Business Requirement Document.
        </p>

        <div className="form-group">
          <label htmlFor="meeting-transcript">Meeting Transcript *</label>
          <textarea
            id="meeting-transcript"
            placeholder="Paste your meeting notes or discussion points here"
            rows={6}
            value={meetingTranscript}
            onChange={(e) => setMeetingTranscript(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="concept-note">Concept Note</label>
          <div className="upload-box">
            <span>Drag and drop file here or click to browse</span>
            <p className="supported-formats">Supported formats: PDF, DOC, DOCX, TXT, Max size: 5MB</p>
            <button className="browse-button" onClick={handleBrowseClick}>
              Browse Files
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt"
            />
            {conceptNote && <p className="uploaded-file">Uploaded: {conceptNote.name}</p>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="additional-context">Additional Context (Optional)</label>
          <textarea
            id="additional-context"
            placeholder="Add any extra information, stakeholder inputs, or project goals"
            rows={4}
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
          />
        </div>

        {loading && (
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        )}

        <div className="form-actions">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
          <button className="generate-button" onClick={generateBRD} disabled={loading}>
            {loading ? 'Generating...' : 'Generate BRD'}
          </button>
        </div>
      </section>

      {/* Generated BRD Section (Visible After Generation) */}
      {generatedBRD && (
        <section className="generated-brd">
          <div className="section-header">
            <h2>Business Requirements Document</h2>
            <div className="brd-actions">
              <button className="edit-button">Edit</button>
              <button className="download-button" onClick={() => downloadBRDAsDoc(generatedBRD)}>
                Download DOC
              </button>
              <button className="back-button" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="brd-content">
            <h3>Generated BRD</h3>
            <p>{generatedBRD}</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default GenerateBRD;