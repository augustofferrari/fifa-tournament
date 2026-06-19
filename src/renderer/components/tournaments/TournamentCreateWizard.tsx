import { useMemo, useState } from 'react'
import type { Player } from '@shared/types/player'
import type { CreateTournamentInput } from '@shared/types/tournament'
import {
  getTournamentFormatLabel,
  getTournamentFormatOptions,
} from '@shared/tournament/format-display.utils'
import {
  DEFAULT_TOURNAMENT_FORMAT,
  TournamentFormat,
} from '@shared/types/tournament-format'
import { MIN_TOURNAMENT_PLAYERS } from '@shared/validation'
import { validateTournamentFormatConfig } from '@shared/validation/tournament-format'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { getErrorMessage } from '@renderer/i18n/ipc-error'
import { displayPlayerName } from '@renderer/i18n/display-utils'
import { PlayerSelector } from './PlayerSelector'
import {
  buildFormatConfigInput,
  getFormatConfigSummary,
  getKnockoutOnlyBracketSizeLabel,
  getWizardSteps,
  PLAYOFF_QUALIFIER_OPTIONS,
  validateWizardReview,
  validateWizardStep,
  type TournamentWizardState,
  type WizardStepId,
} from './tournament-wizard.validation'

interface TournamentCreateWizardProps {
  players: Player[]
  isSubmitting: boolean
  onSubmit: (input: CreateTournamentInput, playerIds: string[]) => Promise<void>
  onCancel: () => void
}

function getInitialState(): TournamentWizardState {
  return {
    name: '',
    playerIds: [],
    format: DEFAULT_TOURNAMENT_FORMAT,
    playoffQualifiedCount: '4',
    groupCount: '',
    qualifiersPerGroup: '2',
  }
}

export function TournamentCreateWizard({
  players,
  isSubmitting,
  onSubmit,
  onCancel,
}: TournamentCreateWizardProps) {
  const { t, locale } = useAppTranslation()
  const [state, setState] = useState<TournamentWizardState>(getInitialState)
  const [stepIndex, setStepIndex] = useState(0)
  const [stepErrors, setStepErrors] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  const wizardSteps = useMemo(() => getWizardSteps(t), [t])
  const formatOptions = useMemo(() => getTournamentFormatOptions(locale), [locale])
  const currentStep = wizardSteps[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === wizardSteps.length - 1

  const selectedPlayers = useMemo(
    () => players.filter((player) => state.playerIds.includes(player.id)),
    [players, state.playerIds],
  )

  const formatConfig = useMemo(() => {
    try {
      return validateTournamentFormatConfig(buildFormatConfigInput(state))
    } catch {
      return null
    }
  }, [state])

  const reviewErrors = useMemo(
    () => validateWizardReview(state, t, locale),
    [state, t, locale],
  )
  const configSummary = formatConfig ? getFormatConfigSummary(state, formatConfig, t) : []

  function updateState(partial: Partial<TournamentWizardState>) {
    setState((current) => ({ ...current, ...partial }))
    setStepErrors([])
    setSubmitError(null)
  }

  function validateCurrentStep(): boolean {
    const errors = validateWizardStep(currentStep.id, state, t, locale)
    setStepErrors(errors)
    return errors.length === 0
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      return
    }

    setStepIndex((index) => Math.min(index + 1, wizardSteps.length - 1))
    setStepErrors([])
  }

  function handleBack() {
    setStepIndex((index) => Math.max(index - 1, 0))
    setStepErrors([])
    setSubmitError(null)
  }

  async function handleCreate() {
    const errors = validateWizardReview(state, t, locale)
    setStepErrors(errors)

    if (errors.length > 0) {
      return
    }

    setSubmitError(null)

    try {
      const formatConfigResult = validateTournamentFormatConfig(buildFormatConfigInput(state))

      await onSubmit(
        {
          name: state.name.trim(),
          format: formatConfigResult.format,
          playoffQualifiedCount: formatConfigResult.playoffQualifiedCount,
          groupCount: formatConfigResult.groupCount,
          playersPerGroup: formatConfigResult.playersPerGroup,
        },
        state.playerIds,
      )
    } catch (error) {
      setSubmitError(getErrorMessage(error, t))
    }
  }

  function renderStepContent(stepId: WizardStepId) {
    switch (stepId) {
      case 'basic':
        return (
          <div className="tournament-wizard__step-content">
            <p className="tournament-wizard__step-description">
              {t('tournaments.wizard.basic.description')}
            </p>
            <label className="field">
              <span className="field__label">{t('tournaments.wizard.basic.tournamentName')}</span>
              <input
                className="field__input"
                type="text"
                value={state.name}
                onChange={(event) => updateState({ name: event.target.value })}
                placeholder={t('tournaments.wizard.basic.namePlaceholder')}
                autoFocus
                disabled={isSubmitting}
              />
            </label>
          </div>
        )

      case 'players':
        return (
          <div className="tournament-wizard__step-content">
            <p className="tournament-wizard__step-description">
              {t('tournaments.wizard.players.description', { min: MIN_TOURNAMENT_PLAYERS })}
              {state.format === TournamentFormat.KNOCKOUT_ONLY &&
                t('tournaments.wizard.players.knockoutOnlyNote')}
            </p>
            <div className="field">
              <span className="field__label">
                {t('tournaments.wizard.players.label', {
                  selected: state.playerIds.length,
                  min: MIN_TOURNAMENT_PLAYERS,
                })}
              </span>
              <PlayerSelector
                players={players}
                selectedIds={state.playerIds}
                onChange={(playerIds) => updateState({ playerIds })}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )

      case 'format':
        return (
          <div className="tournament-wizard__step-content">
            <p className="tournament-wizard__step-description">
              {t('tournaments.wizard.format.description')}
            </p>
            <fieldset className="tournament-form__format-fieldset">
              <legend className="field__label">{t('tournaments.wizard.format.legend')}</legend>
              <div className="tournament-form__format-options">
                {formatOptions.map((option) => (
                  <label key={option.format} className="tournament-form__format-option">
                    <input
                      type="radio"
                      name="tournament-format"
                      value={option.format}
                      checked={state.format === option.format}
                      onChange={() => updateState({ format: option.format })}
                      disabled={isSubmitting}
                    />
                    <span className="tournament-form__format-copy">
                      <span className="tournament-form__format-label">{option.label}</span>
                      <span className="tournament-form__format-description">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )

      case 'configure':
        return (
          <div className="tournament-wizard__step-content">
            <p className="tournament-wizard__step-description">
              {t('tournaments.wizard.configure.description', {
                format: getTournamentFormatLabel(state.format, locale),
              })}
            </p>

            {state.format === TournamentFormat.ROUND_ROBIN && (
              <p className="tournament-wizard__info">
                {t('tournaments.wizard.configure.noExtraConfig')}
              </p>
            )}

            {state.format === TournamentFormat.ROUND_ROBIN_PLAYOFFS && (
              <fieldset className="tournament-wizard__option-fieldset">
                <legend className="field__label">
                  {t('tournaments.wizard.configure.qualifiedPlayers')}
                </legend>
                <div className="tournament-wizard__option-grid">
                  {PLAYOFF_QUALIFIER_OPTIONS.map((value: string) => (
                    <label key={value} className="tournament-wizard__option">
                      <input
                        type="radio"
                        name="playoff-qualified-count"
                        value={value}
                        checked={state.playoffQualifiedCount === value}
                        onChange={() => updateState({ playoffQualifiedCount: value })}
                        disabled={isSubmitting}
                      />
                      <span>{t('tournaments.wizard.configure.playersCount', { count: value })}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {state.format === TournamentFormat.GROUPS_KNOCKOUT && (
              <>
                <label className="field">
                  <span className="field__label">
                    {t('tournaments.wizard.configure.numberOfGroups')}
                  </span>
                  <input
                    className="field__input"
                    type="number"
                    min={2}
                    step={1}
                    value={state.groupCount}
                    onChange={(event) => updateState({ groupCount: event.target.value })}
                    placeholder={t('tournaments.wizard.configure.groupsPlaceholder')}
                    disabled={isSubmitting}
                  />
                </label>

                <label className="field">
                  <span className="field__label">
                    {t('tournaments.wizard.configure.qualifiersPerGroup')}
                  </span>
                  <input
                    className="field__input"
                    type="number"
                    min={1}
                    step={1}
                    value={state.qualifiersPerGroup}
                    onChange={(event) => updateState({ qualifiersPerGroup: event.target.value })}
                    placeholder={t('tournaments.wizard.configure.qualifiersPlaceholder')}
                    disabled={isSubmitting}
                  />
                </label>
              </>
            )}

            {state.format === TournamentFormat.KNOCKOUT_ONLY && (
              <div className="tournament-wizard__info-card">
                <span className="tournament-wizard__info-label">
                  {t('tournaments.wizard.configure.bracketSize')}
                </span>
                <span className="tournament-wizard__info-value">
                  {getKnockoutOnlyBracketSizeLabel(state.playerIds.length) ?? t('common.emDash')}
                </span>
                <p className="tournament-wizard__info-hint">
                  {t('tournaments.wizard.configure.bracketAutoDetected', {
                    count: state.playerIds.length,
                  })}
                </p>
              </div>
            )}
          </div>
        )

      case 'review':
        return (
          <div className="tournament-wizard__step-content">
            <p className="tournament-wizard__step-description">
              {t('tournaments.wizard.review.description')}
            </p>

            <dl className="tournament-wizard__review">
              <div className="tournament-wizard__review-row">
                <dt>{t('tournaments.wizard.review.name')}</dt>
                <dd>{state.name.trim() || t('common.emDash')}</dd>
              </div>
              <div className="tournament-wizard__review-row">
                <dt>{t('tournaments.wizard.review.format')}</dt>
                <dd>{getTournamentFormatLabel(state.format, locale)}</dd>
              </div>
              <div className="tournament-wizard__review-row">
                <dt>{t('tournaments.wizard.review.players')}</dt>
                <dd>
                  {selectedPlayers.length === 0
                    ? t('tournaments.wizard.review.noneSelected')
                    : selectedPlayers.map((player) => displayPlayerName(player.name, t)).join(', ')}
                </dd>
              </div>
              <div className="tournament-wizard__review-row">
                <dt>{t('tournaments.wizard.review.configuration')}</dt>
                <dd>
                  {configSummary.length === 0 ? (
                    t('common.emDash')
                  ) : (
                    <ul className="tournament-wizard__review-list">
                      {configSummary.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            </dl>

            {reviewErrors.length > 0 && (
              <div className="alert alert--error">
                <p className="tournament-wizard__validation-title">
                  {t('tournaments.wizard.review.fixIssues')}
                </p>
                <ul className="tournament-wizard__validation-list">
                  {reviewErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="tournament-wizard card">
      <h2 className="tournament-wizard__title">{t('tournaments.wizard.title')}</h2>

      <ol className="tournament-wizard__steps" aria-label={t('common.aria.creationSteps')}>
        {wizardSteps.map((step, index) => {
          const isActive = index === stepIndex
          const isComplete = index < stepIndex

          return (
            <li
              key={step.id}
              className={`tournament-wizard__step${isActive ? ' tournament-wizard__step--active' : ''}${isComplete ? ' tournament-wizard__step--complete' : ''}`}
            >
              <span className="tournament-wizard__step-index">{index + 1}</span>
              <span className="tournament-wizard__step-label">{step.label}</span>
            </li>
          )
        })}
      </ol>

      <div className="tournament-wizard__panel">
        <h3 className="tournament-wizard__panel-title">{currentStep.label}</h3>
        {renderStepContent(currentStep.id)}
      </div>

      {stepErrors.length > 0 && currentStep.id !== 'review' && (
        <div className="alert alert--error">
          <ul className="tournament-wizard__validation-list">
            {stepErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {submitError && <div className="alert alert--error">{submitError}</div>}

      <div className="tournament-wizard__actions">
        <button className="btn btn--ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </button>

        <div className="tournament-wizard__actions-nav">
          {!isFirstStep && (
            <button className="btn btn--ghost" type="button" onClick={handleBack} disabled={isSubmitting}>
              {t('common.back')}
            </button>
          )}

          {isLastStep ? (
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => void handleCreate()}
              disabled={isSubmitting || reviewErrors.length > 0}
            >
              {isSubmitting ? t('common.creating') : t('tournaments.createTournament')}
            </button>
          ) : (
            <button className="btn btn--primary" type="button" onClick={handleNext} disabled={isSubmitting}>
              {t('common.next')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
