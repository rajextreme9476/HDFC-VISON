// src/pages/GenerateTestCases.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GenerateTestCases.css'; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';

const GenerateTestCases: React.FC = () => {
  const navigate = useNavigate();
  const [brdFile, setBrdFile] = useState<File | null>(null);
  const [conceptNoteFile, setConceptNoteFile] = useState<File | null>(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedTestCases, setGeneratedTestCases] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("AIzaSyC35nTY2y-ospXRdM_9bywBreQiIO1jF7w");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Handle file reading
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (error) {
            reject(new Error('Failed to read .docx file: ' + error));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      }
    });
  };

  // Handle form submission to generate test cases
  const generateTestCasesHandler = async () => {
    if (!brdFile) {
      setGeneratedTestCases('Error: Please upload a BRD file.');
      console.log('Error: Please upload a BRD file.###################################');
      return;
    }

    setLoading(true);
    try {
      const brdContent = await readFileContent(brdFile);
      const conceptNoteContent = conceptNoteFile ? await readFileContent(conceptNoteFile) : '';

      const prompt = `
        Generate detailed test cases based on the following inputs. Format the output as a structured document with the following sections:
        - Test Case Overview:
          (Provide a brief overview of the test cases, summarizing their purpose)
        - Test Scenarios:
          * List each test scenario with a description
        - Test Cases:
          * For each test scenario, provide detailed test cases in the format:
            - Test Case ID: (e.g., TC001)
            - Description: (Describe what the test case verifies)
            - Precondition: (List any preconditions)
            - Steps: (List the steps to perform the test)
            - Expected Result: (Describe the expected outcome)

        Inputs:
        - BRD Content:
          ${brdContent}
        - Concept Note Content (optional):
          ${conceptNoteContent || 'Not provided.'}
        - Additional Context (optional):
          ${additionalContext || 'Not provided.'}

        Ensure all sections are populated with relevant content. If a section cannot be populated due to insufficient information, include a note like 'Insufficient details in the provided inputs.' Generate exactly test cases unless specified otherwise.
      `;

      console.log('Send Prompt -------------------- ', prompt);

      const totalCharCount = prompt.length;
      const estimatedTokenCount = Math.ceil(totalCharCount / 4);
      console.log('Estimated token count:', estimatedTokenCount);

      const MAX_TOKENS = 1048575;
      if (estimatedTokenCount > MAX_TOKENS) {
        const excessTokens = estimatedTokenCount - MAX_TOKENS;
        const excessChars = excessTokens * 4;

        const brdCharLimit = brdContent.length - excessChars;
        if (brdCharLimit <= 0) {
          setGeneratedTestCases('Error: The input content is too large to process. Please reduce the size of the BRD file and try again.');
          setLoading(false);
          return;
        }

        const truncatedBrdContent = brdContent.slice(0, brdCharLimit);
        console.log('Truncated BRD content to:', truncatedBrdContent.length, 'characters');

        const truncatedPrompt = `
          Generate detailed test cases based on the following inputs. Format the output as a structured document with the following sections:
          - Test Case Overview:
            (Provide a brief overview of the test cases, summarizing their purpose)
          - Test Scenarios:
            * List each test scenario with a description
          - Test Cases:
            * For each test scenario, provide detailed test cases in the format:
              - Test Case ID: (e.g., TC001)
              - Description: (Describe what the test case verifies)
              - Precondition: (List any preconditions)
              - Steps: (List the steps to perform the test)
              - Expected Result: (Describe the expected outcome)

          Inputs:
          - BRD Content (truncated due to API limits):
            ${truncatedBrdContent}
          - Concept Note Content (optional):
            ${conceptNoteContent || 'Not provided.'}
          - Additional Context (optional):
            ${additionalContext || 'Not provided.'}

          Ensure all sections are populated with relevant content. If a section cannot be populated due to insufficient information, include a note like 'Insufficient details in the provided inputs.' Generate exactly 10 test cases unless specified otherwise.
        `;

        const result = await model.generateContent(truncatedPrompt);
        const testCasesText = result.response.text() || 'Failed to generate test cases content after truncation.';
        console.log('Generated Test Cases Text (after truncation):', testCasesText);
        setGeneratedTestCases(testCasesText);
      } else {
        const result = await model.generateContent(prompt);
        const testCasesText = result.response.text() || 'Failed to generate test cases content.';
        console.log('Generated Test Cases Text:', testCasesText);
        setGeneratedTestCases(testCasesText);
      }
    } catch (error: any) {
      console.error('Error generating test cases:', error);
      setGeneratedTestCases(`Error: Unable to generate test cases. ${error.message || 'Please check your API key and network connection.'}`);
      console.log('Set generatedTestCases to error:', `Error: Unable to generate test cases. ${error.message || 'Please check your API key and network connection.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to format test cases for display
  const formatTestCases = (testCasesText: string) => {
    // Split the text into sections based on major headers
    const sections = testCasesText.split(/\n(?=- Test Scenarios:|- Test Cases:)/).filter(section => section.trim());

    let overview = '';
    let scenarios: string[] = [];
    let testCases: string[] = [];

    // The first section (before "- Test Scenarios:") is the overview
    if (sections.length > 0) {
      overview = sections[0].trim();
    }

    sections.forEach(section => {
      if (section.match(/^- Test Scenarios:/)) {
        scenarios = section
          .replace(/^- Test Scenarios:/, '')
          .trim()
          .split('\n')
          .map(item => item.replace(/^\s*\*\s*/, '').trim())
          .filter(item => item);
      } else if (section.match(/^- Test Cases:/)) {
        const testCaseBlocks = section
          .split(/\n(?=\s*\*\s*Test Case ID:)/)
          .filter(block => block.trim());

        testCases = testCaseBlocks.map(block => {
          const lines = block.split('\n').filter(line => line.trim());
          let formattedBlock = '';
          let isMandatoryFieldMentioned = false;

          lines.forEach(line => {
            if (line.match(/^\s*\*\s*Test Case ID:/)) {
              formattedBlock += `<p><strong>${line.replace(/^\s*\*\s*/, '')}</strong></p>`;
            } else if (line.match(/^\s*-\s*(Description|Precondition|Steps|Expected Result):/)) {
              const cleanedLine = line.replace(/^\s*-\s*/, '');
              formattedBlock += `<p>${cleanedLine}</p>`;
              if (cleanedLine.match(/Nature of Business.*mandatory/i)) {
                isMandatoryFieldMentioned = true;
              }
            }
          });

          if (isMandatoryFieldMentioned) {
            formattedBlock += `<p style="color: red; font-weight: bold;">[UI Validation] Nature of Business field should be marked as mandatory in the form.</p>`;
          }

          return `<div class="test-scenario-block">${formattedBlock}</div>`;
        });
      }
    });

    console.log('Parsed Test Cases Sections:', { overview, scenarios, testCases });

    return `
      <div class="test-cases-container">
        <h1>Test Cases Document</h1>
        <div class="test-cases-section">
          <h2>1. Test Case Overview</h2>
          <p>${overview || 'No overview provided.'}</p>
        </div>

        <div class="test-cases-section">
          <h2>2. Test Scenarios</h2>
          <ul>
            ${scenarios.length ? scenarios.map(scenario => `<li>${scenario}</li>`).join('') : '<li>No scenarios listed.</li>'}
          </ul>
        </div>

        <div class="test-cases-section">
          <h2>3. Test Cases</h2>
          ${testCases.length ? testCases.join('') : '<p>No test cases listed.</p>'}
        </div>

        <div class="test-cases-footer">
          <p><strong>End of Document</strong></p>
        </div>
      </div>
    `;
  };

  // Function to parse test cases for Excel export
  const parseTestCasesForExcel = (testCasesText: string) => {
    const sections = testCasesText.split(/\n(?=- Test Scenarios:|- Test Cases:)/).filter(section => section.trim());
    console.log('Sections:', sections);

    let overview = '';
    let scenarios: string[] = [];
    const testCases: any[] = [];

    // The first section (before "- Test Scenarios:") is the overview
    if (sections.length > 0) {
      overview = sections[0].trim();
      console.log('Overview:', overview);
    }

    sections.forEach(section => {
      if (section.match(/^- Test Scenarios:/)) {
        scenarios = section
          .replace(/^- Test Scenarios:/, '')
          .trim()
          .split('\n')
          .map(item => item.replace(/^\s*\*\s*/, '').trim())
          .filter(item => item);
        console.log('Scenarios:', scenarios);
      } else if (section.match(/^- Test Cases:/)) {
        const testCaseBlocks = section
          .split(/\n(?=\s*\*\s*Test Case ID:)/)
          .filter(block => block.trim());

        console.log('Test Case Blocks:', testCaseBlocks);

        testCaseBlocks.forEach(block => {
          let testCase: any = {};
          let currentField = '';
          let currentValue: string[] = [];

          const lines = block.split('\n').filter(line => line.trim());
          console.log('Lines in Test Case Block:', lines);

          lines.forEach(line => {
            if (line.match(/^\s*\*\s*Test Case ID:/)) {
              testCase['Test Case ID'] = line.replace(/^\s*\*\s*Test Case ID:/, '').trim();
              currentField = '';
            } else if (line.match(/^\s*-\s*Description:/)) {
              testCase['Description'] = line.replace(/^\s*-\s*Description:/, '').trim();
              currentField = '';
            } else if (line.match(/^\s*-\s*Precondition:/)) {
              testCase['Precondition'] = line.replace(/^\s*-\s*Precondition:/, '').trim();
              currentField = '';
            } else if (line.match(/^\s*-\s*Steps:/)) {
              currentField = 'Steps';
              currentValue = [];
              if (line.replace(/^\s*-\s*Steps:/, '').trim()) {
                currentValue.push(line.replace(/^\s*-\s*Steps:/, '').trim());
              }
            } else if (line.match(/^\s*-\s*Expected Result:/)) {
              if (currentField === 'Steps') {
                testCase['Steps'] = currentValue.join('\n').trim();
              }
              testCase['Expected Result'] = line.replace(/^\s*-\s*Expected Result:/, '').trim();
              currentField = '';
            } else if (currentField === 'Steps') {
              currentValue.push(line.replace(/^\s*\d+\.\s*/, '').trim());
            }
          });

          if (currentField === 'Steps') {
            testCase['Steps'] = currentValue.join('\n').trim();
          }

          testCase['Test Case ID'] = testCase['Test Case ID'] || '';
          testCase['Description'] = testCase['Description'] || '';
          testCase['Precondition'] = testCase['Precondition'] || '';
          testCase['Steps'] = testCase['Steps'] || '';
          testCase['Expected Result'] = testCase['Expected Result'] || '';
          testCase['Note'] = testCase['Note'] || '';

          if (Object.keys(testCase).length > 0) {
            testCases.push(testCase);
          }
        });

        console.log('Parsed Test Cases:', testCases);
      }
    });

    const workbookData: any[] = [];

    workbookData.push({
      sheet: 'Overview',
      data: [{ Overview: overview || 'No overview provided.' }],
    });

    const scenariosData = scenarios.length
      ? scenarios.map((scenario, index) => ({ 'Scenario Number': index + 1, Scenario: scenario }))
      : [{ 'Scenario Number': 1, Scenario: 'No scenarios listed.' }];
    workbookData.push({
      sheet: 'Scenarios',
      data: scenariosData,
    });

    const testCasesData = testCases.length
      ? testCases
      : [{ 'Test Case ID': 'N/A', Description: 'No test cases listed.', Precondition: '', Steps: '', 'Expected Result': '', Note: '' }];
    workbookData.push({
      sheet: 'Test Cases',
      data: testCasesData,
    });

    console.log('Workbook Data:', workbookData);

    return workbookData;
  };

  // Generate and download the test cases as an Excel file
  const downloadTestCasesAsExcel = (testCasesText: string) => {
    const workbookData = parseTestCasesForExcel(testCasesText);

    const workbook = XLSX.utils.book_new();

    workbookData.forEach(({ sheet, data }) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet);
    });

    const today = new Date();
    const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `TestCases_${dateString}.xlsx`;
    console.log('Downloading file as:', fileName);

    XLSX.writeFile(workbook, fileName);
  };

  const isError = generatedTestCases?.startsWith('Error');

  return (
    <div className="generator-page generate-test-cases">
      <>
        <section className="input-details">
          <div className="section-header">
            <div className="header-logo-title">
              <h2>Generate Test Cases</h2>
            </div>
            <button className="profile-button">
              <span className="profile-initials">JS</span>
            </button>
          </div>
          <p className="instructions">
            Please upload the BRD and optionally the Concept Note and Additional Context to generate test cases.
          </p>

          <div className="form-group">
            <label htmlFor="brd-upload">Upload BRD *</label>
            <input
              type="file"
              id="brd-upload"
              accept=".txt,.doc,.docx,.pdf"
              onChange={(e) => setBrdFile(e.target.files ? e.target.files[0] : null)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="concept-note-upload">Upload Concept Note (Optional)</label>
            <input
              type="file"
              id="concept-note-upload"
              accept=".txt,.doc,.docx,.pdf"
              onChange={(e) => setConceptNoteFile(e.target.files ? e.target.files[0] : null)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="additional-context">Additional Context (Optional)</label>
            <textarea
              id="additional-context"
              placeholder="Provide any additional context or requirements for test case generation"
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
            <button className="generate-button" onClick={generateTestCasesHandler} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Test Cases'}
            </button>
          </div>
        </section>

        {console.log('Should render Generated Test Cases Section, generatedTestCases:', generatedTestCases)}
        {!isError && generatedTestCases && (
          <section className="generate-test-cases">
            <div className="section-header">
              <h2>Test Cases Document</h2>
              <div className="brd-actions">
                <button className="download-button" onClick={() => downloadTestCasesAsExcel(generatedTestCases)}>
                  Download Excel
                </button>
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard Test
                </button>
              </div>
            </div>
            <div className="brd-content">
              <h3>Generated Test Cases</h3>
              <div dangerouslySetInnerHTML={{ __html: formatTestCases(generatedTestCases) }} />
            </div>
          </section>
        )}

        {isError && generatedTestCases && (
          <section className="generate-test-cases">
            <div className="section-header">
              <h2>Test Cases Document</h2>
              <div className="brd-actions">
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </button>
              </div>
            </div>
            <div className="brd-content">
              <h3>Error</h3>
              <p style={{ color: 'red' }}>{generatedTestCases}</p>
            </div>
          </section>
        )}
      </>
    </div>
  );
};

export default GenerateTestCases;