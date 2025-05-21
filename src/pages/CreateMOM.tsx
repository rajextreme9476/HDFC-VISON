// src/pages/CreateMOM.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateMOM.css';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CreateMOM: React.FC = () => {
  const navigate = useNavigate();
  const [meetingTranscript, setMeetingTranscript] = useState('');
  const [generatedMOM, setGeneratedMOM] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI('YOUR_API_KEY'); // Replace with your valid API key
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Updated model name

  // Handle form submission to generate MOM
  const generateMOM = async () => {
    if (!meetingTranscript.trim()) {
      setGeneratedMOM('Error: Meeting transcript cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const prompt = `
        You are an expert in generating structured Minutes of Meeting (MOM) documents. Based on the following meeting transcript, create a detailed and structured MOM with the following sections, each with a clear heading followed by a colon (e.g., 'Meeting Summary:'). Use bullet points (starting with '* ') for lists under Attendees, Action Items, Discussion Points, and Next Steps. If a section cannot be populated based on the transcript, include a note like '* Not discussed in this meeting.' Ensure the content is concise, professional, and relevant.

        **Meeting Transcript**:
        ${meetingTranscript}

        **Instructions**:
        - **Meeting Summary**: Summarize the main purpose and outcomes of the meeting in 2-3 sentences.
        - **Attendees**: List all participants mentioned in the transcript. If no names are mentioned, infer potential attendees from context or note '* No attendees explicitly listed.'
        - **Action Items**: Identify tasks assigned to individuals or teams, including deadlines if mentioned. Look for phrases like 'assigned to,' 'will handle,' or 'responsible for.'
        - **Discussion Points**: List key topics or issues discussed, focusing on decisions made or opinions shared.
        - **Next Steps**: Outline follow-up actions or plans, even if not explicitly stated, by inferring from the discussion.

        **Example Output**:
        Meeting Summary:
        The meeting focused on project planning and resource allocation.

        Attendees:
        * John Doe
        * Jane Smith

        Action Items:
        * John to finalize budget by 2025-05-20.
        * Jane to schedule follow-up meeting.

        Discussion Points:
        * Budget constraints were reviewed.
        * Team roles were clarified.

        Next Steps:
        * Finalize project timeline by next meeting.

        Generate the MOM based on the provided transcript.
      `;
      const result = await model.generateContent(prompt);
      const momText = result.response.text();
      
      if (!momText || momText.includes('Failed') || momText.length < 50) {
        throw new Error('Generated MOM is empty or too short.');
      }

      console.log('Generated MOM Text:', momText); // Debug log
      setGeneratedMOM(momText);
    } catch (error: any) {
      console.error('Error generating MOM:', error);
      setGeneratedMOM(`Error: Unable to generate MOM. ${error.message || 'Please try again or check your transcript.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Format MOM for display and download
  const formatMOM = (momText: string) => {
    // Normalize text to handle variations
    const normalizedText = momText.replace(/\r\n/g, '\n').trim();
    
    // Split into sections with flexible regex
    const sections = normalizedText.split(/\n\s*(?=(Meeting Summary|Attendees|Action Items|Discussion Points|Next Steps)[:\s]*)/i).filter(section => section.trim());

    let meetingSummary = '';
    let attendees: string[] = [];
    let actionItems: string[] = [];
    let discussionPoints: string[] = [];
    let nextSteps: string[] = [];

    // Parse each section
    sections.forEach(section => {
      const sectionLower = section.toLowerCase();
      if (sectionLower.match(/^meeting summary[:\s]*/i)) {
        meetingSummary = section.replace(/^meeting summary[:\s]*/i, '').trim();
      } else if (sectionLower.match(/^attendees[:\s]*/i)) {
        attendees = section
          .replace(/^attendees[:\s]*/i, '')
          .trim()
          .split('\n')
          .map(item => item.replace(/^\s*[\*\-\d+\.\s]+/, '').trim())
          .filter(item => item && !item.match(/not discussed/i));
      } else if (sectionLower.match(/^action items[:\s]*/i)) {
        actionItems = section
          .replace(/^action items[:\s]*/i, '')
          .trim()
          .split('\n')
          .map(item => item.replace(/^\s*[\*\-\d+\.\s]+/, '').trim())
          .filter(item => item && !item.match(/not discussed/i));
      } else if (sectionLower.match(/^discussion points[:\s]*/i)) {
        discussionPoints = section
          .replace(/^discussion points[:\s]*/i, '')
          .trim()
          .split('\n')
          .map(item => item.replace(/^\s*[\*\-\d+\.\s]+/, '').trim())
          .filter(item => item && !item.match(/not discussed/i));
      } else if (sectionLower.match(/^next steps[:\s]*/i)) {
        nextSteps = section
          .replace(/^next steps[:\s]*/i, '')
          .trim()
          .split('\n')
          .map(item => item.replace(/^\s*[\*\-\d+\.\s]+/, '').trim())
          .filter(item => item && !item.match(/not discussed/i));
      }
    });

    // Log parsed sections for debugging
    console.log('Parsed Sections:', {
      meetingSummary,
      attendees,
      actionItems,
      discussionPoints,
      nextSteps,
    });

    // HTML structure for display and download
    return `
      <h1>Minutes of Meeting</h1>
      <h3>Meeting Summary</h3>
      <p>${meetingSummary || 'No summary provided.'}</p>
      <h3>Attendees</h3>
      <ul>
        ${attendees.length ? attendees.map(attendee => `<li>${attendee}</li>`).join('') : '<li>No attendees listed.</li>'}
      </ul>
      <h3>Action Items</h3>
      <ul>
        ${actionItems.length ? actionItems.map(item => `<li>${item}</li>`).join('') : '<li>No action items listed.</li>'}
      </ul>
      <h3>Discussion Points</h3>
      <ul>
        ${discussionPoints.length ? discussionPoints.map(point => `<li>${point}</li>`).join('') : '<li>No discussion points listed.</li>'}
      </ul>
      <h3>Next Steps</h3>
      <ul>
        ${nextSteps.length ? nextSteps.map(step => `<li>${step}</li>`).join('') : '<li>No next steps listed.</li>'}
      </ul>
    `;
  };

  // Generate and download the MOM as a .doc file
  const downloadMOMAsDoc = (momText: string) => {
    const formattedContent = formatMOM(momText);
    const docContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Minutes of Meeting</title>
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
          body { font-family: 'Roboto', Arial, sans-serif; margin: 20px; }
          h1 { font-size: 24px; color: #333; font-weight: 600; }
          h3 { font-size: 18px; color: #333; font-weight: 600; margin: 15px 0 10px; }
          p, li { font-size: 14px; color: #666; line-height: 1.5; }
          ul { margin: 10px 0; padding-left: 20px; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        ${formattedContent}
      </body>
      </html>
    `;

    const blob = new Blob([docContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Minutes_of_Meeting.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="generate-mom">
      {/* Input Details Section */}
      <section className="input-details">
        <div className="section-header">
          <h2>Create MOM</h2>
          <button className="profile-button">
            <span className="profile-initials">JS</span>
          </button>
        </div>
        <p className="instructions">
          Please provide the meeting transcript to generate your Minutes of Meeting (MOM).
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

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        )}

        <div className="form-actions">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
          <button className="generate-button" onClick={generateMOM} disabled={loading}>
            {loading ? 'Generating...' : 'Create MOM'}
          </button>
        </div>
      </section>

      {/* Generated MOM Section (Visible After Generation) */}
      {generatedMOM && (
        <section className="generated-mom">
          <div className="section-header">
            <h2>Minutes of Meeting</h2>
            <div className="mom-actions">
              <button className="download-button" onClick={() => downloadMOMAsDoc(generatedMOM)}>
                Download DOC
              </button>
              <button className="back-button" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="mom-content">
            <div dangerouslySetInnerHTML={{ __html: formatMOM(generatedMOM) }} />
          </div>
        </section>
      )}
    </div>
  );
};

export default CreateMOM;