import { useMemo, useState } from 'react'
import type { Player } from '@shared/types/player'
import type { CreateTournamentInput } from '@shared/types/tournament'
import {
  DEFAULT_TOURNAMENT_FORMAT,
  TOURNAMENT_FORMAT_OPTIONS,
  TournamentFormat,
} from '@shared/types/tournament-format'
import { MIN_TOURNAMENT_PLAYERS, ValidationError } from '@shared/validation'
import { validateTournamentFormatConfig } from '@shared/validation/tournament-format'
import { PlayerSelector } from './PlayerSelector'
import {
  buildFormatConfigInput,
  getFormatConfigSummary,
  getFormatLabel,
  getKnockoutOnlyBracketSizeLabel,
  PLAYOFF_QUALIFIER_OPTIONS,
  validateWizardReview,
  validateWizardStep,
  WIZARD_STEPS,
  type TournamentWizardState,
  type WizardStepId,
} from './tournament-wizard.validation'

interface TournamentCreateWizardProps {
  players: Player[]
  isSubmitting: boolean
  onSubmit: (input: CreateTournamentInput, playerIds: string[]) => Promise<void>
  onCancel: () => void
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
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
  const [state, setState] = useState<TournamentWizardState>(getInitialState)
  const [stepIndex, setStepIndex] = useState(0)
  const [stepErrors, setStepErrors] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  const currentStep = WIZARD_STEPS[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1

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

  const reviewErrors = useMemo(() => validateWizardReview(state), [state])
  const configSummary = formatConfig ? getFormatConfigSummary(state, formatConfig) : []

  function updateState(partial: Partial<TournamentWizardState>) {
    setState((current) => ({ ...current, ...partial }))
    setStepErrors([])
    setSubmitError(null)
  }

  function validateCurrentStep(): boolean {
    const errors = validateWizardStep(currentStep.id, state)
    setStepErrors(errors)
    return errors.length === 0
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      return
    }

    setStepIndex((index) => Math.min(index + 1, WIZARD_STEPS.length - 1))
    setStepErrors([])
  }

  function handleBack() {
    setStepIndex((index) => Math.max(index - 1, 0))
    setStepErrors([])
    setSubmitError(null)
  }

  async function handleCreate() {
    const errors = validateWizardReview(state)
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
      setSubmitError(getErrorMessage(error))
    }
  }

  function renderStepContent(stepId: WizardStepId) {
    switch (stepId) {
      case 'basic':
        return (
          <div className="tournament-wizard__step-content">
            <p className="tournament-wizard__step-description">
              Choose a name for your tournament. You can change other settings in the next steps.
            </p>
            <label className="field">
              <span className="field__label">Tournament name</span>
              <input
                className="field__input"
                type="text"
                value={state.name}
                onChange={(event) => updateState({ name: event.target.value })}
                placeholder="Enter tournament name"
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
              Select at least {MIN_TOURNAMENT_PLAYERS} players to participate.
              {state.format === TournamentFormat.KNOCKOUT_ONLY &&
                ' Knockout-only supports up to 16 players.'}
            </p>
            <div className="field">
              <span className="field__label">
                Players ({state.playerIds.length} selected, minimum {MIN_TOURNAMENT_PLAYERS})
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
              Pick how matches will be structured for this tournament.
            </p>
            <fieldset className="tournament-form__format-fieldset">
              <legend className="field__label">Tournament format</legend>
              <div className="tournament-form__format-options">
                {TOURNAMENT_FORMAT_OPTIONS.map((option) => (
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
              Configure options for <strong>{getFormatLabel(state.format)}</strong>.
            </p>

            {state.format === TournamentFormat.ROUND_ROBIN && (
              <p className="tournament-wizard__info">No extra configuration is required for round robin.</p>
            )}

            {state.format === TournamentFormat.ROUND_ROBIN_PLAYOFFS && (
              <fieldset className="tournament-wizard__option-fieldset">
                <legend className="field__label">Qualified players</legend>
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
                      <span>{value} players</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {state.format === TournamentFormat.GROUPS_KNOCKOUT && (
              <>
                <label className="field">
                  <span className="field__label">Number of groups</span>
                  <input
                    className="field__input"
                    type="number"
                    min={2}
                    step={1}
                    value={state.groupCount}
                    onChange={(event) => updateState({ groupCount: event.target.value })}
                    placeholder="e.g. 4"
                    disabled={isSubmitting}
                  />
                </label>

                <label className="field">
                  <span className="field__label">Qualifiers per group</span>
                  <input
                    className="field__input"
                    type="number"
                    min={1}
                    step={1}
                    value={state.qualifiersPerGroup}
                    onChange={(event) => updateState({ qualifiersPerGroup: event.target.value })}
                    placeholder="e.g. 2"
                    disabled={isSubmitting}
                  />
                </label>
              </>
            )}

            {state.format === TournamentFormat.KNOCKOUT_ONLY && (
              <div className="tournament-wizard__info-card">
                <span className="tournament-wizard__info-label">Bracket size</span>
                <span className="tournament-wizard__info-value">
                  {getKnockoutOnlyBracketSizeLabel(state.playerIds.length) ?? '—'}
                </span>
                <p className="tournament-wizard__info-hint">
                  Auto-detected from {state.playerIds.length} selected player
                  {state.playerIds.length === 1 ? '' : 's'}. Smaller brackets are padded with BYEs when needed.
                </p>
              </div>
            )}
          </div>
        )

      case 'review':
        return (
          <div className="tournament-wizard__step-content">
            <p className="tournament-wizard__step-description">
              Review your tournament settings before creating.
            </p>

            <dl className="tournament-wizard__review">
              <div className="tournament-wizard__review-row">
                <dt>Name</dt>
                <dd>{state.name.trim() || '—'}</dd>
              </div>
              <div className="tournament-wizard__review-row">
                <dt>Format</dt>
                <dd>{getFormatLabel(state.format)}</dd>
              </div>
              <div className="tournament-wizard__review-row">
                <dt>Players</dt>
                <dd>
                  {selectedPlayers.length === 0
                    ? 'None selected'
                    : selectedPlayers.map((player) => player.name).join(', ')}
                </dd>
              </div>
              <div className="tournament-wizard__review-row">
                <dt>Configuration</dt>
                <dd>
                  {configSummary.length === 0 ? (
                    '—'
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
                <p className="tournament-wizard__validation-title">Fix these issues before creating:</p>
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
      <h2 className="tournament-wizard__title">Create Tournament</h2>

      <ol className="tournament-wizard__steps" aria-label="Creation steps">
        {WIZARD_STEPS.map((step, index) => {
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
          Cancel
        </button>

        <div className="tournament-wizard__actions-nav">
          {!isFirstStep && (
            <button className="btn btn--ghost" type="button" onClick={handleBack} disabled={isSubmitting}>
              Back
            </button>
          )}

          {isLastStep ? (
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => void handleCreate()}
              disabled={isSubmitting || reviewErrors.length > 0}
            >
              {isSubmitting ? 'Creating…' : 'Create Tournament'}
            </button>
          ) : (
            <button className="btn btn--primary" type="button" onClick={handleNext} disabled={isSubmitting}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
