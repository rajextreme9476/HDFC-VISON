// src/pages/CreateMOM.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateMOM.css';
import { GoogleGenerativeAI } from "@google/generative-ai";

const CreateMOM: React.FC = () => {
  const navigate = useNavigate();
  const [meetingTranscript, setMeetingTranscript] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingSubject, setMeetingSubject] = useState('');
  const [generatedMOM, setGeneratedMOM] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("AIzaSyC35nTY2y-ospXRdM_9bywBreQiIO1jF7w");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Handle form submission to generate MOM
  const generateMOM = async () => {
    if (!meetingTranscript.trim()) {
      setGeneratedMOM('Error: Meeting transcript cannot be empty.');
      return;
    }
    if (!meetingDate.trim() || !meetingTime.trim() || !meetingSubject.trim()) {
      setGeneratedMOM('Error: Please provide the meeting date, time, and subject.');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Generate a detailed and structured Minutes of Meeting (MOM) based on the following meeting transcript:\n\n${meetingTranscript}\n\nPlease include the following sections with clear headings followed by a colon (e.g., 'Meeting Summary:', 'Attendees:'): Meeting Summary, Attendees, Action Items, Discussion Points, and Next Steps. Use bullet points (e.g., '* Item 1') for lists under Attendees, Action Items, Discussion Points, and Next Steps. Ensure all sections are populated with relevant content based on the transcript. If a section cannot be populated, include a note like 'Not discussed in this meeting.'`;
      const result = await model.generateContent(prompt);
      const momText = result.response.text() || 'Failed to generate MOM content.';
      console.log('Generated MOM Text:', momText); // Debug log to see the API response
      setGeneratedMOM(momText);
    } catch (error: any) {
      console.error('Error generating MOM:', error);
      setGeneratedMOM(`Error: Unable to generate MOM. ${error.message || 'Please check your API key and network connection.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to format MOM for display and download
  const formatMOM = (momText: string) => {
    // Split the MOM text into sections based on headings (more flexible regex)
    const sections = momText.split(/\n(?=(Meeting Summary|Attendees|Action Items|Discussion Points|Next Steps)(:|\s)*)/i).filter(section => section.trim());

    let meetingSummary = '';
    let attendees: string[] = [];
    let actionItems: string[] = [];
    let discussionPoints: string[] = [];
    let nextSteps: string[] = [];

    // Parse each section
    sections.forEach(section => {
      if (section.match(/^(Meeting Summary)(:|\s)/i)) {
        meetingSummary = section.replace(/^(Meeting Summary)(:|\s)*/i, '').trim();
      } else if (section.match(/^(Attendees)(:|\s)/i)) {
        attendees = section
          .replace(/^(Attendees)(:|\s)*/i, '')
          .trim()
          .split('\n')
          .map(item => item.replace(/^\*\s*|-|\d+\.\s*/, '').trim())
          .filter(item => item);
      } else if (section.match(/^(Action Items)(:|\s)/i)) {
        actionItems = section
          .replace(/^(Action Items)(:|\s)*/i, '')
          .trim()
          .split('\n')
          .map(item => item.replace(/^\*\s*|-|\d+\.\s*/, '').trim())
          .filter(item => item);
      } else if (section.match(/^(Discussion Points)(:|\s)/i)) {
        discussionPoints = section
          .replace(/^(Discussion Points)(:|\s)*/i, '')
          .trim()
          .split('\n')
          .map(item => item.replace(/^\*\s*|-|\d+\.\s*/, '').trim())
          .filter(item => item);
      } else if (section.match(/^(Next Steps)(:|\s)/i)) {
        nextSteps = section
          .replace(/^(Next Steps)(:|\s)*/i, '')
          .trim()
          .split('\n')
          .map(item => item.replace(/^\*\s*|-|\d+\.\s*/, '').trim())
          .filter(item => item);
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

    // HTML structure for display and download using dynamic values
    return `
      <div class="mom-container">
        <h1>Minutes of Meeting</h1>
        <div class="mom-header">
          <p><strong>Date:</strong> ${meetingDate}</p>
          <p><strong>Time:</strong> ${meetingTime}</p>
          <p><strong>Subject:</strong> ${meetingSubject}</p>
        </div>

        <div class="mom-section">
          <h2>1. Meeting Summary</h2>
          <p>${meetingSummary || 'No summary provided.'}</p>
        </div>

        <div class="mom-section">
          <h2>2. Attendees</h2>
          <ul>
            ${attendees.length ? attendees.map(attendee => `<li>${attendee}</li>`).join('') : '<li>No attendees listed.</li>'}
          </ul>
        </div>

        <div class="mom-section">
          <h2>3. Action Items</h2>
          <ul>
            ${actionItems.length ? actionItems.map(item => `<li>${item}</li>`).join('') : '<li>No action items listed.</li>'}
          </ul>
        </div>

        <div class="mom-section">
          <h2>4. Discussion Points</h2>
          <ul>
            ${discussionPoints.length ? discussionPoints.map(point => `<li>${point}</li>`).join('') : '<li>No discussion points listed.</li>'}
          </ul>
        </div>

        <div class="mom-section">
          <h2>5. Next Steps</h2>
          <ul>
            ${nextSteps.length ? nextSteps.map(step => `<li>${step}</li>`).join('') : '<li>No next steps listed.</li>'}
          </ul>
        </div>

        <div class="mom-footer">
          <p><strong>End of Meeting</strong></p>
        </div>
      </div>
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
          body { 
            font-family: 'Arial', sans-serif; 
            color: #333; 
            line-height: 1.6; 
            margin: 40px; 
          }
          h1 { 
            font-size: 24pt; 
            color: #333; 
            text-align: center; 
            margin-bottom: 20pt; 
          }
          .mom-header p { 
            font-size: 12pt; 
            margin: 5pt 0; 
          }
          .mom-section { 
            margin-bottom: 20pt; 
          }
          .mom-section h2 { 
            font-size: 16pt; 
            color: #333; 
            font-weight: bold; 
            margin-bottom: 10pt; 
          }
          .mom-section p { 
            font-size: 12pt; 
            color: #666; 
            margin-bottom: 10pt; 
          }
          .mom-section ul { 
            list-style-type: disc; 
            padding-left: 20pt; 
            margin-bottom: 10pt; 
          }
          .mom-section ul li { 
            font-size: 12pt; 
            color: #666; 
            margin-bottom: 8pt; 
          }
          .mom-section ul li strong { 
            color: #333; 
          }
          .mom-footer { 
            margin-top: 20pt; 
            text-align: center; 
          }
          .mom-footer p { 
            font-size: 12pt; 
            font-weight: bold; 
            color: #333; 
          }
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
    <div className="generator-page create-mom">
      {/* Input Details Section */}
      <section className="input-details">
        <div className="section-header">
          <div className="header-logo-title">
            <h2>Create MOM</h2>
          </div>
          <button className="profile-button">
            <span className="profile-initials">JS</span>
          </button>
        </div>
        <p className="instructions">
          Please provide the meeting details and transcript to generate your Minutes of Meeting (MOM).
        </p>

        <div className="form-group">
          <label htmlFor="meeting-date">Meeting Date *</label>
          <input
            type="date"
            id="meeting-date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="meeting-time">Meeting Time *</label>
          <input
            type="text"
            id="meeting-time"
            placeholder="e.g., 10:00 AM - 11:00 AM"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="meeting-subject">Meeting Subject *</label>
          <input
            type="text"
            id="meeting-subject"
            placeholder="e.g., Net Banking Requirements"
            value={meetingSubject}
            onChange={(e) => setMeetingSubject(e.target.value)}
          />
        </div>

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
          <div className="loading-bar">
            <div className="loading-progress"></div>
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
        <section className="generate-mom">
          <div className="section-header">
            <h2>Minutes of Meeting</h2>
            <div className="brd-actions">
              <button className="download-button" onClick={() => downloadMOMAsDoc(generatedMOM)}>
                Download DOC
              </button>
              <button className="back-button" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="brd-content">
            <h3>Generated MOM</h3>
            <div dangerouslySetInnerHTML={{ __html: formatMOM(generatedMOM) }} />
          </div>
        </section>
      )}
    </div>
  );
};

export default CreateMOM;