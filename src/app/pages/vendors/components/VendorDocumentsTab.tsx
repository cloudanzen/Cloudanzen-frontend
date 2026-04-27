import { useTranslation } from 'react-i18next';

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { VendorDocumentKind, VendorQuestionnaireAnswer, VendorReviewDocument } from '@/services/api/vendors';

function ReviewDocumentCard(props: {
  document: VendorReviewDocument;
  onDelete: () => void;
}) {
  const { t } = useTranslation('vendors');
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{props.document.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {props.document.kind} • {Math.round(props.document.size / 1024)} KB
          </p>
          {props.document.downloadUrl && (
            <a href={props.document.downloadUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-600 underline">
              {t('phase3.openDocument')}
            </a>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline">
            {props.document.extractionStatus === 'READY' ? t('phase3.extractionReady') : t('phase3.extractionFailed')}
          </Badge>
          <Button size="sm" variant="outline" onClick={props.onDelete}>
            {t('phase3.deleteDocument')}
          </Button>
        </div>
      </div>
      {props.document.extractionWarning && <p className="mt-2 text-sm text-amber-700">{props.document.extractionWarning}</p>}
      {props.document.controlLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {props.document.controlLinks.map((link) => (
            <Badge key={link.id} variant="secondary">
              {link.control?.title ?? link.controlId}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionnaireAnswerCard(props: {
  answer: VendorQuestionnaireAnswer;
  editValue: string;
  onEditChange: (value: string) => void;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation('vendors');
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{props.answer.questionText}</p>
          {props.answer.confidence && <p className="text-xs text-muted-foreground">{t('phase3.confidence')}: {props.answer.confidence}</p>}
        </div>
        <Badge variant="outline">{props.answer.status}</Badge>
      </div>
      <textarea className="mt-3 min-h-[100px] w-full rounded-md border border-border px-3 py-2 text-sm" value={props.editValue} onChange={(e) => props.onEditChange(e.target.value)} />
      {props.answer.citationsJson && props.answer.citationsJson.length > 0 && (
        <div className="mt-3 space-y-2">
          {props.answer.citationsJson.map((citation) => (
            <div key={citation.chunkId} className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{citation.documentTitle}</p>
              <p>{citation.excerpt}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={props.onDismiss}>{t('phase3.dismissAnswer')}</Button>
        <Button size="sm" onClick={props.onAccept}>{t('phase3.acceptAnswer')}</Button>
      </div>
    </div>
  );
}

export function VendorDocumentsTab(props: {
  hasOpenReview: boolean;
  reviewAiStatus: 'IDLE' | 'QUEUED' | 'COMPLETED';
  selectedKind: VendorDocumentKind;
  onSelectedKindChange: (kind: VendorDocumentKind) => void;
  onFileChange: (file: File | null) => void;
  selectedFile: File | null;
  onUpload: () => void;
  uploading: boolean;
  onRunAiReview: () => void;
  runningAiReview: boolean;
  documents: VendorReviewDocument[];
  onDeleteDocument: (documentId: string) => void;
  questionnaireAnswers: VendorQuestionnaireAnswer[];
  answerEdits: Record<string, string>;
  onAnswerEditChange: (answerId: string, value: string) => void;
  onAcceptAnswer: (answer: VendorQuestionnaireAnswer) => void;
  onDismissAnswer: (answer: VendorQuestionnaireAnswer) => void;
  suggestedControls: Array<{
    documentId: string;
    controlId: string;
    controlTitle: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    rationale: string;
  }>;
  onAcceptControl: (suggestion: {
    documentId: string;
    controlId: string;
    controlTitle: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    rationale: string;
  }) => void;
}) {
  const { t } = useTranslation('vendors');

  if (!props.hasOpenReview) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          {t('phase3.startReviewFirst')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t('phase3.documentsTitle')}</CardTitle>
            <Badge variant="outline">
              {props.reviewAiStatus === 'QUEUED'
                ? t('phase3.statusQueued')
                : props.reviewAiStatus === 'COMPLETED'
                  ? t('phase3.statusCompleted')
                  : t('phase3.statusIdle')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select value={props.selectedKind} onChange={(e) => props.onSelectedKindChange(e.target.value as VendorDocumentKind)} className="rounded-md border border-border px-3 py-2 text-sm">
              <option value="SOC2">SOC 2</option>
              <option value="ISO27001">ISO 27001</option>
              <option value="PEN_TEST">Pen test</option>
              <option value="DPA">DPA</option>
              <option value="PRIVACY_POLICY">Privacy policy</option>
              <option value="OTHER">Other</option>
            </select>
            <Input type="file" accept=".pdf,.txt,.md" onChange={(e) => props.onFileChange(e.target.files?.[0] ?? null)} />
            <Button disabled={!props.selectedFile || props.uploading} onClick={props.onUpload}>
              {props.uploading ? t('dialog.saving') : t('phase3.upload')}
            </Button>
            <Button variant="outline" disabled={props.documents.length === 0 || props.runningAiReview} onClick={props.onRunAiReview}>
              {props.runningAiReview ? t('phase3.running') : t('phase3.runAiReview')}
            </Button>
          </div>
          {props.documents.length === 0 && <p className="text-sm text-muted-foreground">{t('phase3.noDocuments')}</p>}
          {props.documents.map((document) => (
            <ReviewDocumentCard key={document.id} document={document} onDelete={() => props.onDeleteDocument(document.id)} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('phase3.questionnaireTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.questionnaireAnswers.length === 0 && <p className="text-sm text-muted-foreground">{t('phase3.noAnswers')}</p>}
          {props.questionnaireAnswers.map((answer) => (
            <QuestionnaireAnswerCard
              key={answer.id}
              answer={answer}
              editValue={props.answerEdits[answer.id] ?? answer.finalText ?? answer.draftText ?? ''}
              onEditChange={(value) => props.onAnswerEditChange(answer.id, value)}
              onAccept={() => props.onAcceptAnswer(answer)}
              onDismiss={() => props.onDismissAnswer(answer)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('phase3.suggestedControlsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {props.suggestedControls.length === 0 && <p className="text-sm text-muted-foreground">{t('phase3.noSuggestedControls')}</p>}
          {props.suggestedControls.map((suggestion) => (
            <div key={`${suggestion.documentId}-${suggestion.controlId}`} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{suggestion.controlTitle}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.controlId}</p>
                </div>
                <Badge variant="outline">{suggestion.confidence}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{suggestion.rationale}</p>
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={() => props.onAcceptControl(suggestion)}>{t('phase3.acceptControl')}</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
