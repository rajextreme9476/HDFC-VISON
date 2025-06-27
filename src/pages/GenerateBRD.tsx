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
      prompt += `
## Document Control
**Authorization**
| Field | Value |
|-------|-------|
| TEMPLATE NAME | Feature Story Template Mobile Banking |
| TEMPLATE VERSION | 1.1 |
| EFFECTIVE DATE | 26th June 2025 |
| TEMPLATE OWNER | Enterprise Factory Bengaluru |
| TEMPLATE APPROVER | Process Owner |
| DOCUMENT OWNER | Mansi Vora |
| DOCUMENT CLASSIFICATION | Restricted |
| DOCUMENT VERSION NO. | 1.1 |

## Review
| TEMPLATE VERSION | DATE | AUTHOR | DESCRIPTION |
|------------------|------|--------|-------------|
| 1.0 | 11th June 2025 | Mansi Vora | Released version of the Feature story |
| 1.1 | 26th June 2025 | Mansi Vora | Updated the remarks basis discussion with other UH |

## Epic / Transaction Title
- EPIC No: [NA]
- EPIC Name: [NA]
- Transaction Name: [NA]
- Feature Name: [Fill based on input]
- TPO/TPM Name: [NA]

## Overview
- Brief description of the feature (in not more than 3 sentences): [Fill based on input]
- **Section # : Narrative**
  - To be filled by TPO
  - As a/an (type of user): Retail Mobile Banking CASA
  - I need to (do some task(s)): [Fill based on input]
  - so that (I can get some result): [Fill based on input]

## Business Value
- Expected customer & business benefit: [Fill based on input]
- Business outcome, user need, and strategic intent (quantifiable/quality), expected volume, TPS (in case new feature altogether): [Fill based on input]
- Project Category: Small/Medium/Large (L1/L2/L3): [NA]

## Figma/Design Links
- Include Mobile design VD’s: [NA]

## Acceptance Criteria (Functional + Non-Functional)
- All the journey must be explained here: [Fill based on input]
- If possible, try to make a flowchart/sequence diagram: [NA]
- | S.No | Scenario | Criteria | GIVEN | WHEN | THEN |
  |------|----------|----------|-------|------|------|
  | 1 | Happy Path/Positive flow | Successful flow with expected user inputs, this should include Field level validations basis each screen, Toast messages, error messages, Batch runs (flows explain in tabular format) | User is KYC-compliant | Clicks on CTA | Transaction completes, FE/BE masking |
  | 2 | Server Failure/Negative flow | Server errors, invalid data, timeouts, Error codes, Slow network, partial response, etc. | User initiates txn | Backend returns 5XX,4xx | Show blackout message with retry later,SSO |
  | 3 | Consent Denied |  | User does not consent | Clicks Submit | Show rejection message |
  | 4 | Check for existing impact on any txns/admin txns |  |  |  |  |
  | 5 | SPOF points |  |  |  |  |
  | 6 | Migration points |  |  |  |  |
  | 7 | Regulatory Compliance | RBI/NPCI mandatory validations, time cutoffs |  |  |  |
  | 8 | Share download | Fields that will be shared/downloaded/mogo etc |  |  |  |

## Field Validations
| Feature | Label | Mandatory(Y/N) | Field Type | Datatype | Field Size | Is it Editable | Remarks |
|---------|-------|----------------|------------|----------|------------|---------------|---------|
| [Fill based on input] |  |  |  |  |  |  |  |

## Checklist
**Section #: Pre-requisites**
- To be filled by BSG BA
- Product processor involved: OBP, FC, Billdesk
- Currencies applicable: Only INR or Non INR
- Migration Impact Line 5 to Line 6 or vice versa (Yes or No): No
- If migration Impact YES: Explain the impact: [NA]
- If for Mobile OS permissions involved: NA for this story
- If for Mobile and any download in device: Yes to be sent to HDFC doc folder
- Language: [NA]
- VD's provided for Dark and Light: [NA]
- Financial/Non financial: [NA]
- Regulatory ask? If yes please provide Guideline or Regulatory body: [NA]
- Ops process note received or WIP or NA: [NA]

## Business Validations
- To be filled by BSG BA
1. Allowed Customer type: [NA]
2. Allowed CASA Relationship: [NA]
3. Allowed Account Status: [NA]
4. Account Memo: [NA]
5. Mnemonic code: [NA]
6. Any external URL or Redirection link(e.g PWS): [NA]
7. Re-KYC/FATCA/KYC: [NA]

## Out of Scope
- What is intentionally excluded from the release: [NA]

## Admin Configurations
| S.No | Configuration | Details |
|------|---------------|---------|
| 1 | ROLES | [NA] |
| 2 | DAM | [NA] |
| 3 | LIMITS | [NA] |
| 4 | List of Masters (new or existing)/Table name | [NA] |
| 5 | APP GEN | [NA] |
| 6 | ERROR DETAILS | [NA] |
| 7 | ADOBE AEM | [NA] |
| 8 | ADOBE TARGET | [NA] |
| 9 | ADOBE ANALYTICS | [NA] |
| 10 | REPORTS | [NA] |
| 11 | BLACKOUT | [NA] |
| 12 | CS | [NA] |
| 13 | ALERTS SMS /EMAIL/Notifications | [NA] |
| 14 | TXN ID List | [NA] |
| 15 | Caching | [NA] |
| 16 | Feature flags required | [NA] |
| 17 | Global search tags | [NA] |

## ISG/Compliance/Risk Checklist
| Domain | Checklist | Explain the requirements here |
|--------|----------|-----------------------------|
| Security | MFA, PRM (RT/NRT), Biocatch, Encryption, masking, any SDK, is SDK scr sign off taken, Kavach, RASP, Lookout, Session parameters | [NA] |
| Regulatory | RBI, NPCI transaction limits, consent, audit logs | [NA] |
| Data Privacy | PII masking, DPSC, DPIA checklist | [NA] |
| Platform Guidelines | App Store + Play Store review checklist, Firebase configuration | [NA] |
| Other Compliance | Accessibility norms | [NA] |

## Cross-Platform Impact
- Mention if any change in MobileBanking is needed: [NA]
- Consistency between platforms required? (Yes/No): [NA]

## NFRs (Non-Functional Requirements having functional impact)
- Other points to be covered by Architecture team
- Response time SLA (e.g., < 2 sec): [NA]
- Purging Policy: [NA]
- Rate Limiting: [NA]
- Memory/Pagination considerations: [NA]

## Test Data & Validation
| Field | Value |
|-------|-------|
| Sample Cust ID | 1234567 |
| Scenario | Prime customer, 3 transactions, OTP failure |

## Documentation
- New Error Codes or existing one’s: [NA]
- Related Confluence: [Link]

## API & Integration
- Common Service: Yes/No: [NA]
- Event-based or API-based integration: [NA]
- API available: Yes or NO: [NA]
- If Yes, API documentation and field mapping done with VD(attach the document), provide OBP JIRA ID: [NA]
- API specs – of Product processor: [NA]
- Dependency: Flex cube / Third-party (NPCI, CIBIL, etc.): [NA]

## Analytics & Monitoring
| Tool | Config |
|------|--------|
| Firebase Crashlytics | Crash trace, ANR monitoring |
| Adobe Analytics | User path, conversion funnel, drop-offs |

Fill in the [Fill based on input] sections and other placeholders based on the provided meeting transcript, concept note, and additional context. Use "NA" for sections where no data is available. Ensure all tables are formatted as shown, with content in black font and headings in blue (RGB: 0, 0, 255).`;

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