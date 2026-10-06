/**
 * SafeRoute — Multilingual Speech Recognition Service
 * Enables drivers to speak instead of typing into the Copilot.
 * Integrates Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * Mapped to the driver's active selected language.
 */

(function (window) {
  "use strict";

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Language to BCP-47 Speech Recognition Locale Mapping
  const SPEECH_LOCALE_MAP = {
    en: "en-IN",
    ta: "ta-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    as: "as-IN",
    ne: "ne-NP",
    meitei: "bn-IN", // Meitei reads via Eastern Indic Bengali phonetic model
    khasi: "en-IN",  // Khasi Latin script
    mizo: "en-IN",   // Mizo Latin script
    nishi: "en-IN",  // Nyishi Latin script
    konyak: "en-IN", // Konyak Latin script
  };

  let recognition = null;
  let isListening = false;
  let activeCallbacks = {
    onInterim: null,
    onFinal: null,
    onStart: null,
    onEnd: null,
    onError: null,
  };

  function isSupported() {
    return Boolean(SpeechRecognition);
  }

  function initRecognition(lang) {
    if (!isSupported()) return null;

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    const locale = SPEECH_LOCALE_MAP[lang] || "en-IN";
    recog.lang = locale;

    recog.onstart = () => {
      isListening = true;
      if (typeof activeCallbacks.onStart === "function") {
        activeCallbacks.onStart(locale);
      }
    };

    recog.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0].transcript;
        if (item.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      if (interimTranscript && typeof activeCallbacks.onInterim === "function") {
        activeCallbacks.onInterim(interimTranscript);
      }
      if (finalTranscript && typeof activeCallbacks.onFinal === "function") {
        activeCallbacks.onFinal(finalTranscript);
      }
    };

    recog.onerror = (event) => {
      isListening = false;
      let userFriendlyMsg = "Voice input error. Please try again.";
      if (event.error === "not-allowed") {
        userFriendlyMsg = "Microphone access was denied. Please allow microphone permission in your browser settings.";
      } else if (event.error === "no-speech") {
        userFriendlyMsg = "No speech was detected. Please tap the microphone and speak clearly.";
      } else if (event.error === "audio-capture") {
        userFriendlyMsg = "No microphone was found on this device.";
      } else if (event.error === "network") {
        userFriendlyMsg = "Speech recognition network timeout. Please check your connection.";
      }

      if (typeof activeCallbacks.onError === "function") {
        activeCallbacks.onError(event.error, userFriendlyMsg);
      }
    };

    recog.onend = () => {
      isListening = false;
      if (typeof activeCallbacks.onEnd === "function") {
        activeCallbacks.onEnd();
      }
    };

    return recog;
  }

  function startListening(options = {}) {
    if (!isSupported()) {
      if (options.onError) {
        options.onError(
          "not-supported",
          "Speech recognition is not supported in this browser. Please use Chrome, Edge, or a Web Speech-compatible mobile browser."
        );
      }
      return false;
    }

    if (isListening) {
      stopListening();
    }

    const currentLang = options.lang || (window.I18N ? window.I18N.getLanguage() : "en");
    activeCallbacks = {
      onInterim: options.onInterim || null,
      onFinal: options.onFinal || null,
      onStart: options.onStart || null,
      onEnd: options.onEnd || null,
      onError: options.onError || null,
    };

    try {
      recognition = initRecognition(currentLang);
      recognition.start();
      return true;
    } catch (e) {
      console.warn("Speech recognition start failed:", e);
      if (options.onError) {
        options.onError("exception", "Could not start voice recognition: " + e.message);
      }
      return false;
    }
  }

  function stopListening() {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (e) {}
    }
    isListening = false;
  }

  function cancelListening() {
    if (recognition && isListening) {
      try {
        recognition.abort();
      } catch (e) {}
    }
    isListening = false;
  }

  window.SafeRouteSpeech = {
    isSupported,
    startListening,
    stopListening,
    cancelListening,
    isListening: () => isListening,
    getLocaleForLang: (lang) => SPEECH_LOCALE_MAP[lang] || "en-IN",
  };
})(window);
