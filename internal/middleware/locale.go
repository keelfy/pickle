package middleware

import (
	"context"
	"net/http"
	"slices"

	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/text/language"
)

const LocaleCtxKey = "req.locale"

func LocaleMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		hfn := func(w http.ResponseWriter, r *http.Request) {
			acceptLanguage := r.Header.Get("Accept-Language")
			locale := utils.DefaultLocale
			if acceptLanguage != "" {
				acceptedLocales, _, err := language.ParseAcceptLanguage(acceptLanguage)
				if err != nil {
					logger.Errorf(r.Context(), "failed to parse accept language: %v", err)
				}

				for _, acceptedLocale := range acceptedLocales {
					if slices.Contains(utils.AllowedLocales, acceptedLocale.String()) {
						locale = acceptedLocale.String()
						break
					}
				}
			} else {
				localeQueryParam := r.URL.Query().Get("locale")
				if localeQueryParam != "" {
					if slices.Contains(utils.AllowedLocales, localeQueryParam) {
						locale = localeQueryParam
					}
				}
			}

			ctx := context.WithValue(r.Context(), LocaleCtxKey, locale)
			next.ServeHTTP(w, r.WithContext(ctx))
		}
		return http.HandlerFunc(hfn)
	}
}
