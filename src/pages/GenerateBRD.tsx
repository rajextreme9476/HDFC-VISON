import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mammoth from 'mammoth';
import { Document, Paragraph, TextRun, Packer, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import './GenerateBRD.css';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GenerateBRD: React.FC = () => {
  const navigate = useNavigate();
  const [meetingTranscript, setMeetingTranscript] = useState('');
  const [conceptNote, setConceptNote] = useState<File | null>(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedBRD, setGeneratedBRD] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genAI = new GoogleGenerativeAI("AIzaSyC35nTY2y-ospXRdM_9bywBreQiIO1jF7w");
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('Uploaded file details:', {
        name: file.name,
        extension: file.name.toLowerCase().substring(file.name.lastIndexOf('.')),
        mimeType: file.type,
        size: file.size,
      });

      const validExtensions = ['.docx'];
      const validMimeTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/octet-stream', // Fallback for some browsers
        '', // Handle empty MIME types
      ];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!validExtensions.includes(fileExtension) || !validMimeTypes.includes(file.type)) {
        alert(`Please upload a valid .docx file. Supported formats: DOCX. Detected extension: ${fileExtension}, MIME type: ${file.type}`);
        return;
      }

      if (file.size === 0) {
        alert('The uploaded file is empty. Please upload a valid .docx file.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('The uploaded file exceeds the 5MB size limit.');
        return;
      }

      setConceptNote(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const generateBRD = async () => {
    setLoading(true);
    try {
      let prompt = `Create a Business Requirements Document (BRD) for a mobile banking feature based on the following inputs:\n\n`;
      prompt += `Meeting Transcript:\n${meetingTranscript}\n\n`;
      prompt += `Additional Context:\n${additionalContext}\n\n`;

      if (conceptNote) {
        try {
          const arrayBuffer = await conceptNote.arrayBuffer();
          console.log('ArrayBuffer size:', arrayBuffer.byteLength);
          const result = await mammoth.extractRawText({ arrayBuffer });
          const conceptNoteText = result.value;
          console.log('Extracted concept note text:', conceptNoteText);
          prompt += `Concept Note:\n${conceptNoteText}\n\n`;
        } catch (fileError: unknown) {
          console.error('Error reading .docx file:', fileError);
          const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error occurred while processing the file.';
          alert(`Failed to process the uploaded .docx file: ${errorMessage}. Proceeding without concept note.`);
        }
      }

      prompt += `Generate the BRD in the exact format of the following template, including all sections and tables as specified. Use plain text with clear section headings (e.g., ## Document Control, ## Review, etc.). For headings, indicate they should be in blue (RGB: 0, 0, 255), and content should be in black. Where data is not available, use "NA" as specified. Do not include a title like "Business Requirements Document" in the content. The template is as follows:\n\n`;
      prompt += `Business Requirements Document (BRD)
Project Title: [Insert Project Name]
 Date: [Insert Date]
 Version: [v1.0]
 Prepared by: [Your Name / Team]

1. Introduction
1.1 Background
Provide a brief background of the problem or opportunity that led to this project.
1.2 Business Need
Explain the specific business need or gap that the project intends to address.

2. Purpose
Define the purpose of the BRD and what this document aims to achieve. This typically includes aligning business goals with technical execution.

3. Scope of Work
3.1 In Scope
List the features, modules, platforms, or use cases included in the scope.
3.2 Out of Scope
Clearly state what will not be delivered as part of this project.

4. Current Process (As-Is)
Describe the current state of the process or system, or state N/A if this is a greenfield (new) initiative.

5. Proposed Process (To-Be)
Explain how the new system, product, or service will function, focusing on user interaction, core functionality, and value addition.

6. Vision Statement
Summarize the long-term objective of the project or product and its intended impact.

7. Target Audience / User Segments
Identify the user groups (e.g., customers, internal teams, partners) who will use or benefit from the product.

8. Functional Requirements
List all key business and user requirements in bullet or numbered form.
Example:
User onboarding and authentication


Dashboard with personalized insights


Notification and reminder engine


Admin panel for content management



9. Non-Functional Requirements
Include performance, scalability, usability, and compliance-related requirements.
Example:
System should support 1 million concurrent users


GDPR and data privacy compliance


Response time < 2 seconds



10. API and Integration Requirements
Outline any third-party or internal systems the solution will integrate with, and API needs.
Example:
REST API for authentication


Integration with credit score providers


Webhooks for real-time notifications



11. Operational Concepts & Scenarios
Describe key user flows or system interactions that are critical to success.
Example:
First-time user onboarding


Daily engagement through learning modules


Gamified goal tracking



12. User Account Management (UAM)
Explain how users will create, manage, and recover their accounts, and what controls will be in place (e.g., password policy, 2FA).

13. Target Environment
Specify supported platforms and devices.
Example:
Android (Primary)


iOS


Web (Mobile-responsive)


Cloud-hosted backend (AWS / Azure / GCP)



14. Assumptions and Constraints
Assumptions
Users have basic digital literacy


Internet connectivity is available


Constraints
Must be deployed in < 3 months


Budget capped at ₹X



15. Success Metrics
Define how success will be measured post-launch.
Example:
30% user activation in 7 days


25% module completion within 30 days


Net Promoter Score (NPS) > 60

16. Appendices
Attach any supporting documents, mockups, or references here.`;

      const result = await model.generateContent(prompt);
      const brdText = result.response.text() || 'Failed to generate BRD content.';
      console.log('Generated BRD text:', brdText);
      setGeneratedBRD(brdText);

      downloadBRDAsDocx(brdText);
    } catch (error: unknown) {
      console.error('Error generating BRD:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setGeneratedBRD(`Error: Unable to generate BRD. ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadBRDAsDocx = (brdText: string) => {
    const blueColor = { color: '0000FF' }; // RGB: 0, 0, 255
    const blackColor = { color: '000000' };
    const docChildren: any[] = [];

    // Split sections correctly
    const sections = brdText.split('\n## ').filter(section => section.trim() !== '');
    sections.forEach((section, index) => {
      const lines = section.split('\n').filter(line => line.trim() !== '');
      const heading = index === 0 && !section.startsWith('##') ? lines[0] : lines[0].replace(/^##\s*/, '');
      const content = index === 0 && !section.startsWith('##') ? lines : lines.slice(1);

      // Add section heading
      if (heading) {
        docChildren.push(
          new Paragraph({
            text: heading,
            heading: HeadingLevel.HEADING_1,
            thematicBreak: true,
            spacing: { before: 200, after: 200 },
            children: [new TextRun({ text: heading, color: '0000FF', bold: true })],
          })
        );
      }

      // Handle specific sections
      if (heading === 'Document Control') {
        const authIndex = content.findIndex(line => line.startsWith('**Authorization**'));
        const authContent = authIndex !== -1 ? content.slice(authIndex + 1) : [];
        const tableContent = authContent.join('\n').match(/\|.*\|/g)?.map(row => row.split('|').map(cell => cell.trim()).filter(cell => cell)) || [];

        docChildren.push(
          new Paragraph({
            text: 'Authorization',
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'Authorization', color: '0000FF', bold: true })],
            spacing: { before: 200, after: 100 },
          })
        );

        if (tableContent.length > 0) {
          const tableRows = [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'Field', children: [new TextRun({ text: 'Field', bold: true, color: '000000' })] })],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Value', children: [new TextRun({ text: 'Value', bold: true, color: '000000' })] })],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            ...tableContent.map(row => new TableRow({
              children: row.map(cell => new TableCell({
                children: [new Paragraph({ text: cell, children: [new TextRun({ text: cell, color: '000000' })] })],
                width: { size: 50, type: WidthType.PERCENTAGE },
              })),
            })),
          ];

          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
            })
          );
        }
      } else if (heading === 'Review') {
        const tableContent = content.join('\n').match(/\|.*\|/g)?.map(row => row.split('|').map(cell => cell.trim()).filter(cell => cell)) || [];
        if (tableContent.length > 0) {
          const tableRows = [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'TEMPLATE VERSION', children: [new TextRun({ text: 'TEMPLATE VERSION', bold: true, color: '000000' })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'DATE', children: [new TextRun({ text: 'DATE', bold: true, color: '000000' })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'AUTHOR', children: [new TextRun({ text: 'AUTHOR', bold: true, color: '000000' })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'DESCRIPTION', children: [new TextRun({ text: 'DESCRIPTION', bold: true, color: '000000' })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            ...tableContent.map(row => new TableRow({
              children: row.map(cell => new TableCell({
                children: [new Paragraph({ text: cell, children: [new TextRun({ text: cell, color: '000000' })] })],
                width: { size: 25, type: WidthType.PERCENTAGE },
              })),
            })),
          ];

          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
            })
          );
        }
      } else if (heading === 'Epic / Transaction Title') {
        content.forEach(line => {
          docChildren.push(
            new Paragraph({
              text: line,
              bullet: { level: 0 },
              children: [new TextRun({ text: line, color: '000000' })],
              spacing: { after: 100 },
            })
          );
        });
      } else if (heading === 'Overview') {
        const narrativeIndex = content.findIndex(line => line.startsWith('**Section # : Narrative**'));
        const preNarrative = narrativeIndex !== -1 ? content.slice(0, narrativeIndex) : content;
        const narrative = narrativeIndex !== -1 ? content.slice(narrativeIndex + 1) : [];

        preNarrative.forEach(line => {
          docChildren.push(
            new Paragraph({
              text: line,
              bullet: { level: 0 },
              children: [new TextRun({ text: line, color: '000000' })],
              spacing: { after: 100 },
            })
          );
        });

        if (narrativeIndex !== -1) {
          docChildren.push(
            new Paragraph({
              text: 'Section # : Narrative',
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: 'Section # : Narrative', color: '0000FF', bold: true })],
              spacing: { before: 200, after: 100 },
            })
          );
          narrative.forEach(line => {
            docChildren.push(
              new Paragraph({
                text: line,
                bullet: { level: 0 },
                children: [new TextRun({ text: line, color: '000000' })],
                spacing: { after: 100 },
              })
            );
          });
        }
      } else if (heading === 'Acceptance Criteria (Functional + Non-Functional)') {
        const tableContent = content.join('\n').match(/\|.*\|/g)?.map(row => row.split('|').map(cell => cell.trim()).filter(cell => cell)) || [];
        const nonTableContent = content.filter(line => !line.startsWith('|'));

        nonTableContent.forEach(line => {
          docChildren.push(
            new Paragraph({
              text: line,
              bullet: { level: 0 },
              children: [new TextRun({ text: line, color: '000000' })],
              spacing: { after: 100 },
            })
          );
        });

        if (tableContent.length > 0) {
          const tableRows = [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'S.No', children: [new TextRun({ text: 'S.No', bold: true, color: '000000' })] })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Scenario', children: [new TextRun({ text: 'Scenario', bold: true, color: '000000' })] })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Criteria', children: [new TextRun({ text: 'Criteria', bold: true, color: '000000' })] })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'GIVEN', children: [new TextRun({ text: 'GIVEN', bold: true, color: '000000' })] })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'WHEN', children: [new TextRun({ text: 'WHEN', bold: true, color: '000000' })] })],
                  width: { size: 15, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'THEN', children: [new TextRun({ text: 'THEN', bold: true, color: '000000' })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            ...tableContent.map(row => new TableRow({
              children: row.map(cell => new TableCell({
                children: [new Paragraph({ text: cell, children: [new TextRun({ text: cell, color: '000000' })] })],
                width: { size: row.indexOf(cell) === 0 ? 10 : row.indexOf(cell) === 1 ? 20 : row.indexOf(cell) === 2 ? 20 : row.indexOf(cell) === 3 ? 20 : row.indexOf(cell) === 4 ? 15 : 25, type: WidthType.PERCENTAGE },
              })),
            })),
          ];

          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
            })
          );
        }
      } else if (heading === 'Field Validations') {
        const tableContent = content.join('\n').match(/\|.*\|/g)?.map(row => row.split('|').map(cell => cell.trim()).filter(cell => cell)) || [];
        if (tableContent.length > 0) {
          const tableRows = [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'Feature', children: [new TextRun({ text: 'Feature', bold: true, color: '000000' })] })],
                  width: { size: 15, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Label', children: [new TextRun({ text: 'Label', bold: true, color: '000000' })] })],
                  width: { size: 15, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Mandatory(Y/N)', children: [new TextRun({ text: 'Mandatory(Y/N)', bold: true, color: '000000' })] })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Field Type', children: [new TextRun({ text: 'Field Type', bold: true, color: '000000' })] })],
                  width: { size: 15, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Datatype', children: [new TextRun({ text: 'Datatype', bold: true, color: '000000' })] })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Field Size', children: [new TextRun({ text: 'Field Size', bold: true, color: '000000' })] })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Is it Editable', children: [new TextRun({ text: 'Is it Editable', bold: true, color: '000000' })] })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Remarks', children: [new TextRun({ text: 'Remarks', bold: true, color: '000000' })] })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            ...tableContent.map(row => new TableRow({
              children: row.map(cell => new TableCell({
                children: [new Paragraph({ text: cell, children: [new TextRun({ text: cell, color: '000000' })] })],
                width: { size: row.indexOf(cell) === 0 ? 15 : row.indexOf(cell) === 1 ? 15 : row.indexOf(cell) === 2 ? 10 : row.indexOf(cell) === 3 ? 15 : row.indexOf(cell) === 4 ? 10 : row.indexOf(cell) === 5 ? 10 : row.indexOf(cell) === 6 ? 10 : 25, type: WidthType.PERCENTAGE },
              })),
            })),
          ];

          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
            })
          );
        }
      } else if (heading === 'Checklist') {
        const preRequisitesIndex = content.findIndex(line => line.startsWith('**Section #: Pre-requisites**'));
        const preRequisites = preRequisitesIndex !== -1 ? content.slice(preRequisitesIndex + 1) : content;
        const prePreRequisites = preRequisitesIndex !== -1 ? content.slice(0, preRequisitesIndex) : [];

        prePreRequisites.forEach(line => {
          docChildren.push(
            new Paragraph({
              text: line,
              bullet: { level: 0 },
              children: [new TextRun({ text: line, color: '000000' })],
              spacing: { after: 100 },
            })
          );
        });

        if (preRequisitesIndex !== -1) {
          docChildren.push(
            new Paragraph({
              text: 'Section #: Pre-requisites',
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: 'Section #: Pre-requisites', color: '0000FF', bold: true })],
              spacing: { before: 200, after: 100 },
            })
          );
          preRequisites.forEach(line => {
            docChildren.push(
              new Paragraph({
                text: line,
                bullet: { level: 0 },
                children: [new TextRun({ text: line, color: '000000' })],
                spacing: { after: 100 },
              })
            );
          });
        }
      } else if (heading === 'Business Validations') {
        content.forEach(line => {
          docChildren.push(
            new Paragraph({
              text: line,
              numbering: { reference: 'numbering', level: 0 },
              children: [new TextRun({ text: line, color: '000000' })],
              spacing: { after: 100 },
            })
          );
        });
      } else if (heading === 'Admin Configurations') {
        const tableContent = content.join('\n').match(/\|.*\|/g)?.map(row => row.split('|').map(cell => cell.trim()).filter(cell => cell)) || [];
        if (tableContent.length > 0) {
          const tableRows = [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'S.No', children: [new TextRun({ text: 'S.No', bold: true, color: '000000' })] })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Configuration', children: [new TextRun({ text: 'Configuration', bold: true, color: '000000' })] })],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Details', children: [new TextRun({ text: 'Details', bold: true, color: '000000' })] })],
                  width: { size: 60, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            ...tableContent.map(row => new TableRow({
              children: row.map(cell => new TableCell({
                children: [new Paragraph({ text: cell, children: [new TextRun({ text: cell, color: '000000' })] })],
                width: { size: row.indexOf(cell) === 0 ? 10 : row.indexOf(cell) === 1 ? 30 : 60, type: WidthType.PERCENTAGE },
              })),
            })),
          ];

          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
            })
          );
        }
      } else if (heading === 'ISG/Compliance/Risk Checklist') {
        const tableContent = content.join('\n').match(/\|.*\|/g)?.map(row => row.split('|').map(cell => cell.trim()).filter(cell => cell)) || [];
        if (tableContent.length > 0) {
          const tableRows = [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'Domain', children: [new TextRun({ text: 'Domain', bold: true, color: '000000' })] })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Checklist', children: [new TextRun({ text: 'Checklist', bold: true, color: '000000' })] })],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Explain the requirements here', children: [new TextRun({ text: 'Explain the requirements here', bold: true, color: '000000' })] })],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            ...tableContent.map(row => new TableRow({
              children: row.map(cell => new TableCell({
                children: [new Paragraph({ text: cell, children: [new TextRun({ text: cell, color: '000000' })] })],
                width: { size: row.indexOf(cell) === 0 ? 20 : row.indexOf(cell) === 1 ? 30 : 50, type: WidthType.PERCENTAGE },
              })),
            })),
          ];

          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
            })
          );
        }
      } else if (heading === 'Test Data & Validation') {
        const tableContent = content.join('\n').match(/\|.*\|/g)?.map(row => row.split('|').map(cell => cell.trim()).filter(cell => cell)) || [];
        if (tableContent.length > 0) {
          const tableRows = [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'Field', children: [new TextRun({ text: 'Field', bold: true, color: '000000' })] })],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Value', children: [new TextRun({ text: 'Value', bold: true, color: '000000' })] })],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            ...tableContent.map(row => new TableRow({
              children: row.map(cell => new TableCell({
                children: [new Paragraph({ text: cell, children: [new TextRun({ text: cell, color: '000000' })] })],
                width: { size: row.indexOf(cell) === 0 ? 50 : 50, type: WidthType.PERCENTAGE },
              })),
            })),
          ];

          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
            })
          );
        }
      } else if (heading === 'Analytics & Monitoring') {
        const tableContent = content.join('\n').match(/\|.*\|/g)?.map(row => row.split('|').map(cell => cell.trim()).filter(cell => cell)) || [];
        if (tableContent.length > 0) {
          const tableRows = [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'Tool', children: [new TextRun({ text: 'Tool', bold: true, color: '000000' })] })],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Config', children: [new TextRun({ text: 'Config', bold: true, color: '000000' })] })],
                  width: { size: 50, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            ...tableContent.map(row => new TableRow({
              children: row.map(cell => new TableCell({
                children: [new Paragraph({ text: cell, children: [new TextRun({ text: cell, color: '000000' })] })],
                width: { size: row.indexOf(cell) === 0 ? 50 : 50, type: WidthType.PERCENTAGE },
              })),
            })),
          ];

          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 },
              },
            })
          );
        }
      } else {
        content.forEach(line => {
          if (!line.startsWith('**') && !line.startsWith('|')) {
            docChildren.push(
              new Paragraph({
                text: line,
                bullet: { level: 0 },
                children: [new TextRun({ text: line, color: '000000' })],
                spacing: { after: 100 },
              })
            );
          } else if (line.startsWith('**') && line.endsWith('**')) {
            docChildren.push(
              new Paragraph({
                text: line.replace(/\*\*/g, ''),
                heading: HeadingLevel.HEADING_2,
                children: [new TextRun({ text: line.replace(/\*\*/g, ''), color: '0000FF', bold: true })],
                spacing: { before: 200, after: 100 },
              })
            );
          }
        });
      }
    });

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'numbering',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: AlignmentType.START,
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'Feature_Story_Mobile_Banking.docx');
    }).catch(error => {
      console.error('Error generating .docx file:', error);
      alert('Failed to generate .docx file.');
    });
  };

  return (
    <div className="generate-brd">
      <section className="input-details">
        <div className="section-header">
          <div className="header-logo-title">
            <img src="/hdfc-logo.png" alt="HDFC Vision" className="header-logo" hidden />
            <h2>Generate BRD</h2>
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
            <p className="supported-formats">Supported format: DOCX, Max size: 5MB</p>
            <button className="browse-button" onClick={handleBrowseClick}>
              Browse Files
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".docx"
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

      {generatedBRD && (
        <section className="generated-brd">
          <div className="section-header">
            <h2>Generated BRD</h2>
            <div className="brd-actions">
              <button className="edit-button">Edit</button>
              <button className="download-button" onClick={() => downloadBRDAsDocx(generatedBRD)}>
                Download DOCX
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