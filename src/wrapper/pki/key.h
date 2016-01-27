#ifndef CMS_PKI_KEY_H_INCLUDED
#define  CMS_PKI_KEY_H_INCLUDED

#include <openssl/evp.h>

#include "../common/common.h"

class CTWRAPPER_API Key;

#include "pki.h"

enum KeyType {
	KT_NONE,
	KT_PRIVATE,
	KT_PUBLIC //��������� KT_ �� ���� 3-� ������
};

class PublicExponent
{
public:
	enum Public_Exponent {
		peRSA_3,
		peRSA_F4
	};

	static PublicExponent::Public_Exponent get(int value){
		switch (value){
		case PublicExponent::peRSA_3:
			return PublicExponent::peRSA_3;
		case PublicExponent::peRSA_F4:
			return PublicExponent::peRSA_F4;
		default:
			THROW_EXCEPTION(0, PublicExponent, NULL, ERROR_DATA_FORMAT_UNKNOWN_FORMAT, value);
		}
	}
};

SSLOBJECT_free(EVP_PKEY, EVP_PKEY_free)

class Key: public SSLObject<EVP_PKEY>{

public:
	SSLOBJECT_new(Key, EVP_PKEY){}
	SSLOBJECT_new_null(Key, EVP_PKEY, EVP_PKEY_new){}

	static Handle<Key> generate();
	void load(std::string filename);
	void read(Handle<Bio> in);
	Handle<Key> publicKey();
	bool compare(Handle<Key>&);
	Handle<Key> duplicate();

	KeyType type;

	int privkeyLoad(std::string filename, DataFormat::DATA_FORMAT format, std::string password); //������ ���������� ����� �� �����
	int privkeyLoadMemory(std::string data, DataFormat::DATA_FORMAT format, std::string password); //������ ���������� ����� �� ������
	int privkeyLoadBIO(BIO* bio, DataFormat::DATA_FORMAT format, std::string password); //������ ���������� ����� �� BIO(OpenSSL)

	int pubkeyLoad(std::string filename, DataFormat::DATA_FORMAT format); //������ ���������� ����� �� �����
	int pubkeyLoadMemory(std::string data, DataFormat::DATA_FORMAT format); //������ ���������� ����� �� ������
	int pubkeyLoadBIO(BIO* bio, DataFormat::DATA_FORMAT format); //������ ���������� ����� �� BIO(OpenSSL)

	int keypairGenerate(std::string filename, DataFormat::DATA_FORMAT format, PublicExponent::Public_Exponent pubEx, int keySize, std::string password); //��������� ������ � ����
	int keypairGenerateMemory(std::string data, DataFormat::DATA_FORMAT format, PublicExponent::Public_Exponent pubEx, int keySize, std::string password); //��������� ������ � ������
	int keypairGenerateBIO(Handle<Bio> bio, DataFormat::DATA_FORMAT format, PublicExponent::Public_Exponent pubEx, int keySize, std::string password); //��������� ������ � BIO(OpenSSL)

	int privkeySave(std::string filename, DataFormat::DATA_FORMAT format, std::string password); //���������� ���������� ����� � ����
	int privkeySaveMemory(std::string data, DataFormat::DATA_FORMAT format, std::string password); //���������� ���������� ����� � ����
	int privkeySaveBIO(Handle<Bio> out, DataFormat::DATA_FORMAT format, std::string password); //���������� ���������� ����� � ����

	int pubkeySave(std::string filename, DataFormat::DATA_FORMAT format); //���������� ���������� ����� � ����
	int pubkeySaveMemory(std::string data, DataFormat::DATA_FORMAT format); //���������� ���������� ����� � ������
	int pubkeySaveBIO(Handle<Bio> out, DataFormat::DATA_FORMAT format); //���������� ���������� ����� � BIO(OpenSSL)
};

#endif //  comment this --->   CMS_PKI_KEY_H_INCLUDED
