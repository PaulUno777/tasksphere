package logger

import (
	"log"
	"time"

	rotateLogger "github.com/lestrrat-go/file-rotatelogs"
)

var InfoLogger *log.Logger
var ErrorLogger *log.Logger

func InitLogger() {
	path := "./logs/app"

	writer, err := rotateLogger.New(
		path+".%Y-%m-%d.log",
		rotateLogger.WithRotationTime(24*time.Hour),
		rotateLogger.WithMaxAge(14*24*time.Hour),
	)
	if err != nil {
		log.Fatalf("Failed to initialize log file: %v", err)
	}

	InfoLogger = log.New(writer, "[INFO] ", log.LstdFlags|log.Lshortfile)
	ErrorLogger = log.New(writer, "[ERROR] ", log.LstdFlags|log.Lshortfile)
}
