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
}): string => {
  if (obj?.localization && obj.localization[locale]?.description) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return obj.localization[locale]!.description;
  }

  return (obj && property && obj[property]) ?? fallback;
};
