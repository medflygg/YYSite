import Typograf from 'typograf';

const tp = new Typograf({ locale: ['ru', 'en-US'] });

/** Неразрывные пробелы у коротких слов, кавычки, тире и др. */
export function typograf(text: string): string {
  if (!text) return text;
  return tp.execute(text);
}

export function typografHtml(html: string): string {
  if (!html) return html;
  return tp.execute(html);
}
