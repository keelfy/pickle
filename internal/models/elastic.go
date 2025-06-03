package models

type ElasticIGDBGame struct {
	EnglishName string `json:"name_en"`
	RussianName string `json:"name_ru"`
	GermanName  string `json:"name_de"`
	SpanishName string `json:"name_es"`
}
