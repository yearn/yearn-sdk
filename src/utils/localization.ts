import { Locale, Localization } from "../types";

interface LocalizationObject {
  localization: Localization;
}
type LocalizedObject<T extends string> = LocalizationObject & {
  [key in T]: string;
};

export const getLocalizedString = <T extends string>({
  obj,
  property,
  locale,
  fallback,
}: {
  obj?: LocalizedObject<T>;
  property?: T;
  locale: Locale;
  fallback: string;
}): string => obj?.localization[locale]?.description ?? (obj && property && obj[property]) ?? fallback;
