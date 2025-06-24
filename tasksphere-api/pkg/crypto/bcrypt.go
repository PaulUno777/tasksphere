package crypto

import "golang.org/x/crypto/bcrypt"

const SaltRounds = 12

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), SaltRounds)
	return string(bytes), err
}

func CompareHashed(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
