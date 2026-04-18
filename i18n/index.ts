import { i18n } from "@lingui/core";
import { getLocales } from "expo-localization";

const { messages: enMessages } = require("../locales/en/messages");
const { messages: arMessages } = require("../locales/ar/messages");
const { messages: bnMessages } = require("../locales/bn/messages");
const { messages: deMessages } = require("../locales/de/messages");
const { messages: esMessages } = require("../locales/es/messages");
const { messages: filMessages } = require("../locales/fil/messages");
const { messages: frMessages } = require("../locales/fr/messages");
const { messages: hiMessages } = require("../locales/hi/messages");
const { messages: idMessages } = require("../locales/id/messages");
const { messages: itMessages } = require("../locales/it/messages");
const { messages: jaMessages } = require("../locales/ja/messages");
const { messages: koMessages } = require("../locales/ko/messages");
const { messages: msMessages } = require("../locales/ms/messages");
const { messages: nlMessages } = require("../locales/nl/messages");
const { messages: plMessages } = require("../locales/pl/messages");
const { messages: ptMessages } = require("../locales/pt/messages");
const { messages: ruMessages } = require("../locales/ru/messages");
const { messages: thMessages } = require("../locales/th/messages");
const { messages: trMessages } = require("../locales/tr/messages");
const { messages: urMessages } = require("../locales/ur/messages");
const { messages: viMessages } = require("../locales/vi/messages");
const { messages: zhMessages } = require("../locales/zh/messages");

const supportedLocales = [
	"en",
	"ar",
	"bn",
	"de",
	"es",
	"fil",
	"fr",
	"hi",
	"id",
	"it",
	"ja",
	"ko",
	"ms",
	"nl",
	"pl",
	"pt",
	"ru",
	"th",
	"tr",
	"ur",
	"vi",
	"zh",
] as const;

type SupportedLocale = (typeof supportedLocales)[number];

const supportedLocaleSet = new Set<string>(supportedLocales);
const localeAliases: Partial<Record<string, SupportedLocale>> = {
	in: "id",
	tl: "fil",
};

i18n.load({
	en: enMessages,
	ar: arMessages,
	bn: bnMessages,
	de: deMessages,
	es: esMessages,
	fil: filMessages,
	fr: frMessages,
	hi: hiMessages,
	id: idMessages,
	it: itMessages,
	ja: jaMessages,
	ko: koMessages,
	ms: msMessages,
	nl: nlMessages,
	pl: plMessages,
	pt: ptMessages,
	ru: ruMessages,
	th: thMessages,
	tr: trMessages,
	ur: urMessages,
	vi: viMessages,
	zh: zhMessages,
});

function normalizeLocale(locale: string) {
	return locale.toLowerCase().replace("_", "-");
}

function resolveDeviceLocale(): SupportedLocale {
	for (const locale of getLocales()) {
		const languageTag = normalizeLocale(locale.languageTag);
		const languageCode = locale.languageCode
			? normalizeLocale(locale.languageCode)
			: languageTag.split("-")[0];

		if (supportedLocaleSet.has(languageTag)) {
			return languageTag as SupportedLocale;
		}

		if (supportedLocaleSet.has(languageCode)) {
			return languageCode as SupportedLocale;
		}

		const alias = localeAliases[languageCode] ?? localeAliases[languageTag];
		if (alias) {
			return alias;
		}
	}

	return "en";
}

i18n.activate(resolveDeviceLocale());

export { i18n };
