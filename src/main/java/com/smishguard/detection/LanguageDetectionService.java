package com.smishguard.detection;

import com.google.common.base.Optional;
import com.optimaize.langdetect.LanguageDetector;
import com.optimaize.langdetect.LanguageDetectorBuilder;
import com.optimaize.langdetect.i18n.LdLocale;
import com.optimaize.langdetect.ngram.NgramExtractors;
import com.optimaize.langdetect.profiles.LanguageProfile;
import com.optimaize.langdetect.profiles.LanguageProfileReader;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class LanguageDetectionService {

    private final LanguageDetector detector;
    private final Map<String, String> languageMap;

    public LanguageDetectionService() throws Exception {
        List<LanguageProfile> profiles = new LanguageProfileReader().readAllBuiltIn();
        detector = LanguageDetectorBuilder.create(NgramExtractors.standard())
                .withProfiles(profiles)
                .build();

        languageMap = Map.ofEntries(
                Map.entry("af", "Afrikaans"),
                Map.entry("ar", "Arabic"),
                Map.entry("bg", "Bulgarian"),
                Map.entry("bn", "Bengali"),
                Map.entry("ca", "Catalan"),
                Map.entry("cs", "Czech"),
                Map.entry("cy", "Welsh"),
                Map.entry("da", "Danish"),
                Map.entry("de", "German"),
                Map.entry("el", "Greek"),
                Map.entry("en", "English"),
                Map.entry("es", "Spanish"),
                Map.entry("et", "Estonian"),
                Map.entry("fa", "Persian (Farsi)"),
                Map.entry("fi", "Finnish"),
                Map.entry("fr", "French"),
                Map.entry("gu", "Gujarati"),
                Map.entry("he", "Hebrew"),
                Map.entry("hi", "Hindi"),
                Map.entry("hr", "Croatian"),
                Map.entry("hu", "Hungarian"),
                Map.entry("id", "Indonesian"),
                Map.entry("is", "Icelandic"),
                Map.entry("it", "Italian"),
                Map.entry("ja", "Japanese"),
                Map.entry("kn", "Kannada"),
                Map.entry("ko", "Korean"),
                Map.entry("lt", "Lithuanian"),
                Map.entry("lv", "Latvian"),
                Map.entry("mk", "Macedonian"),
                Map.entry("ml", "Malayalam"),
                Map.entry("mr", "Marathi"),
                Map.entry("ne", "Nepali"),
                Map.entry("nl", "Dutch"),
                Map.entry("no", "Norwegian"),
                Map.entry("pa", "Punjabi"),
                Map.entry("pl", "Polish"),
                Map.entry("pt", "Portuguese"),
                Map.entry("ro", "Romanian"),
                Map.entry("ru", "Russian"),
                Map.entry("sk", "Slovak"),
                Map.entry("sl", "Slovenian"),
                Map.entry("so", "Somali"),
                Map.entry("sq", "Albanian"),
                Map.entry("sv", "Swedish"),
                Map.entry("sw", "Swahili"),
                Map.entry("ta", "Tamil"),
                Map.entry("te", "Telugu"),
                Map.entry("th", "Thai"),
                Map.entry("tl", "Tagalog"),
                Map.entry("tr", "Turkish"),
                Map.entry("uk", "Ukrainian"),
                Map.entry("ur", "Urdu"),
                Map.entry("vi", "Vietnamese"),
                Map.entry("zh-cn", "Chinese (Simplified)"),
                Map.entry("zh-tw", "Chinese (Traditional)")
        );
    }

    public String detectLanguage(String message) {
        Optional<LdLocale> langCode = detector.detect(message);
        return langCode.isPresent()
                ? languageMap.getOrDefault(langCode.get().getLanguage(), "Unknown")
                : "Unknown";
    }
}
