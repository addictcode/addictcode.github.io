import { useState, type FormEvent } from 'react'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'

interface Message {
  id: number
  mine: boolean
  /** номер статьи базы знаний; -1 — ответа нет, вопрос ушёл оператору */
  article?: number
  text?: string
}

/** Ассистент поддержки: отвечает по базе знаний, а без ответа передаёт диалог человеку. */
export function AssistantDemo() {
  const { t } = useLang()
  const d = t.lab.assistant
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')

  const ask = (question: string) => {
    const clean = question.trim()
    if (!clean) return
    const lower = clean.toLowerCase()
    const article = d.kb.findIndex((entry) => entry.keys.some((key) => lower.includes(key)))
    setMessages((prev) => [...prev, { id: prev.length, mine: true, text: clean }, { id: prev.length + 1, mine: false, article }])
    setText('')
    emit({ kick: ['assistant'], route: article < 0 ? ['assistant', 'llm', 'crm'] : ['llm', 'assistant'] })
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    ask(text)
  }
  const handed = messages.some((message) => message.article === -1)

  return (
    <div className="lab__cols">
      <div className="panel">
        <p className="panel__title mono">{d.botName}</p>
        <ul className="chat" aria-live="polite">
          <li className="bubble">{d.greet}</li>
          {messages.map((message) =>
            message.mine ? (
              <li key={message.id} className="bubble bubble--me">
                {message.text}
              </li>
            ) : message.article !== undefined && message.article >= 0 ? (
              <li key={message.id} className="bubble" data-answer="kb">
                <span>{d.kb[message.article].answer}</span>
                <span className="mono">
                  {d.source}: {d.kb[message.article].title}
                </span>
              </li>
            ) : (
              <li key={message.id} className="bubble" data-answer="handoff">
                {d.handoff}
              </li>
            ),
          )}
        </ul>
        <div className="opts">
          {d.presets.map((preset) => (
            <button key={preset} type="button" className="btn" data-log="off" onClick={() => ask(preset)}>
              {preset}
            </button>
          ))}
        </div>
        <form className="ask" onSubmit={submit}>
          <input type="text" value={text} placeholder={d.placeholder} aria-label={d.placeholder} maxLength={80} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn btn--solid" data-log="off">
            {d.send}
          </button>
        </form>
        <p className="lab__state mono" role="status">
          {handed ? d.operator : ''}
        </p>
      </div>

      <div className="panel">
        <p className="panel__title mono">{d.kbTitle}</p>
        <ul className="plain">
          {d.kb.map((entry) => (
            <li key={entry.title}>
              <b>{entry.title}</b>
              <span className="kb__text">{entry.answer}</span>
            </li>
          ))}
        </ul>
        <p className="note">{d.note}</p>
      </div>
    </div>
  )
}
