import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { VendorDocumentsTab } from '@/app/pages/vendors/components/VendorDocumentsTab';

describe('vendor phase 3 documents tab', () => {
  it('renders empty states and triggers run/upload actions', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    const onRunAiReview = vi.fn();

    render(
      <VendorDocumentsTab
        hasOpenReview
        reviewAiStatus="IDLE"
        selectedKind="SOC2"
        onSelectedKindChange={() => undefined}
        onFileChange={() => undefined}
        selectedFile={new File(['test'], 'soc2.pdf', { type: 'application/pdf' })}
        onUpload={onUpload}
        uploading={false}
        onRunAiReview={onRunAiReview}
        runningAiReview={false}
        documents={[]}
        onDeleteDocument={() => undefined}
        questionnaireAnswers={[]}
        answerEdits={{}}
        onAnswerEditChange={() => undefined}
        onAcceptAnswer={() => undefined}
        onDismissAnswer={() => undefined}
        suggestedControls={[]}
        onAcceptControl={() => undefined}
      />,
    );

    expect(screen.getByText('phase3.noDocuments')).toBeInTheDocument();
    expect(screen.getByText('phase3.noAnswers')).toBeInTheDocument();
    expect(screen.getByText('phase3.noSuggestedControls')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'phase3.runAiReview' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'phase3.upload' }));

    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(onRunAiReview).not.toHaveBeenCalled();
  });

  it('renders answers, citations, and suggested controls', async () => {
    const user = userEvent.setup();
    const onAcceptAnswer = vi.fn();
    const onDismissAnswer = vi.fn();
    const onAcceptControl = vi.fn();

    render(
      <VendorDocumentsTab
        hasOpenReview
        reviewAiStatus="COMPLETED"
        selectedKind="SOC2"
        onSelectedKindChange={() => undefined}
        onFileChange={() => undefined}
        selectedFile={null}
        onUpload={() => undefined}
        uploading={false}
        onRunAiReview={() => undefined}
        runningAiReview={false}
        documents={[
          {
            id: 'doc-1',
            vendorId: 'vendor-1',
            vendorReviewId: 'review-1',
            kind: 'SOC2',
            fileName: 'soc2.pdf',
            fileUrl: '/files/doc.pdf',
            size: 2048,
            uploadedAt: '2026-01-01T00:00:00.000Z',
            uploadedByUserId: 'user-1',
            aiDocumentId: 'ai-1',
            downloadUrl: '/download/doc.pdf',
            extractionStatus: 'READY',
            extractionWarning: null,
            controlLinks: [],
          },
        ]}
        onDeleteDocument={() => undefined}
        questionnaireAnswers={[
          {
            id: 'ans-1',
            questionKey: 'mfa',
            questionText: 'Does the vendor enforce MFA?',
            draftText: 'Yes, MFA is enforced.',
            finalText: null,
            citationsJson: [
              {
                chunkId: 'chunk-1',
                documentId: 'ai-1',
                documentTitle: 'SOC 2 Report',
                excerpt: 'Multi-factor authentication is required.',
              },
            ],
            status: 'PENDING',
            confidence: 'HIGH',
            generationId: 'gen-1',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]}
        answerEdits={{ 'ans-1': 'Yes, MFA is enforced.' }}
        onAnswerEditChange={() => undefined}
        onAcceptAnswer={onAcceptAnswer}
        onDismissAnswer={onDismissAnswer}
        suggestedControls={[
          {
            documentId: 'doc-1',
            controlId: 'ctrl-1',
            controlTitle: 'Access Control Policy',
            confidence: 'HIGH',
            rationale: 'The document cites MFA and privileged access control.',
          },
        ]}
        onAcceptControl={onAcceptControl}
      />,
    );

    expect(screen.getByText('Does the vendor enforce MFA?')).toBeInTheDocument();
    expect(screen.getByText('SOC 2 Report')).toBeInTheDocument();
    expect(screen.getByText('Access Control Policy')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'phase3.acceptAnswer' }));
    await user.click(screen.getByRole('button', { name: 'phase3.dismissAnswer' }));
    await user.click(screen.getByRole('button', { name: 'phase3.acceptControl' }));

    expect(onAcceptAnswer).toHaveBeenCalledTimes(1);
    expect(onDismissAnswer).toHaveBeenCalledTimes(1);
    expect(onAcceptControl).toHaveBeenCalledWith(
      expect.objectContaining({ controlId: 'ctrl-1' }),
    );
  });
});
