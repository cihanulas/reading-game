import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db/db';
import { AGE_GROUPS, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type AgeGroup, type LangCode } from '../lang';
import { useApp } from '../store/app';
import { AVATARS } from '../ui/avatars';
import { CharacterArt } from '../ui/GameArt';

const MAX_NAME_LENGTH = 20;

export function CreateProfileScreen() {
  const { t } = useTranslation();
  const { go, selectProfile } = useApp();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [lang, setLang] = useState<LangCode>(DEFAULT_LANGUAGE);

  const trimmed = name.trim();
  const valid = trimmed.length > 0 && ageGroup !== null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const id = await db.profiles.add({
      name: trimmed.slice(0, MAX_NAME_LENGTH),
      avatar,
      ageGroup,
      lang,
      targetWpm: null,
      createdAt: Date.now(),
    });
    selectProfile(id, 'placement');
  };

  return (
    <section className="screen profile-create-screen">
      <form className="card form captain-form" onSubmit={submit}>
        <h2>{t('createProfile.title')}</h2>
        <div className="captain-greeting"><CharacterArt value={avatar} /><p className="speech">{t('createProfile.greeting')}</p></div>

        <label className="name-field">
          {t('createProfile.name')}
          <input
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder={t('createProfile.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>

        <fieldset className="character-field">
          <legend>{t('createProfile.avatar')}</legend>
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                className={`btn avatar-pick ${a === avatar ? 'selected' : ''}`}
                onClick={() => setAvatar(a)}
                aria-pressed={a === avatar}
              >
                <CharacterArt value={a} />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="age-field">
          <legend>{t('ageGroup.label')}</legend>
          <div className="choices two">
            {AGE_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                className={`btn choice ${g === ageGroup ? 'chosen' : ''}`}
                onClick={() => setAgeGroup(g)}
                aria-pressed={g === ageGroup}
              >
                {t(`ageGroup.${g}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {SUPPORTED_LANGUAGES.length > 1 && (
          <label className="language-field">
            {t('createProfile.language')}
            <select value={lang} onChange={(e) => setLang(e.target.value as LangCode)}>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {t(`language.${l}`)}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="row form-actions">
          <button type="button" className="btn ghost" onClick={() => go('profiles')}>
            {t('createProfile.cancel')}
          </button>
          <button type="submit" className="btn primary" disabled={!valid}>
            {t('createProfile.submit')}
          </button>
        </div>
      </form>
    </section>
  );
}
