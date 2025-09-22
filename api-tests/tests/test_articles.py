import os
import json
import pytest
import requests
from jsonschema import validate
from dotenv import load_dotenv

# Carrega variáveis do .env na raiz do repo
load_dotenv()

API_URL = os.getenv("API_URL", "https://api.realworld.show/api")
TEST_EMAIL = os.getenv("TEST_EMAIL", "qauser@example.com")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "Test1234")

def _schema_path(name: str) -> str:
    return os.path.join(os.path.dirname(__file__), f"../schemas/{name}")

@pytest.fixture(scope="session")
def article_schema():
    with open(_schema_path("article.json"), "r", encoding="utf-8") as f:
        return json.load(f)

@pytest.fixture(scope="session")
def auth_headers():
    """
    Obtém token de autenticação.
    1) Tenta login /users/login
    2) Se falhar (bug conhecido), faz registo /users e usa o token devolvido.
    """
    # 1) Tentar login normal
    try:
        r = requests.post(f"{API_URL}/users/login", json={
            "user": {"email": TEST_EMAIL, "password": TEST_PASSWORD}
        }, timeout=15)
        data = r.json() if r.headers.get("content-type","").startswith("application/json") else {}
    except Exception:
        data = {}

    if isinstance(data, dict) and "user" in data and "token" in data["user"]:
        token = data["user"]["token"]
    else:
        # 2) Fallback: registar utilizador e usar token do próprio registo
        reg = requests.post(f"{API_URL}/users", json={
            "user": {
                "username": TEST_EMAIL.split("@")[0],
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        }, timeout=15)
        reg_data = reg.json() if reg.headers.get("content-type","").startswith("application/json") else {}
        if not isinstance(reg_data, dict) or "user" not in reg_data or "token" not in reg_data["user"]:
            pytest.skip(f"Não foi possível obter token (login/registo falharam). "
                        f"Status login={locals().get('r', None) and r.status_code} "
                        f"Status registo={reg.status_code}")
        token = reg_data["user"]["token"]

    return {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }

def test_get_articles():
    """GET /articles deve responder 200 e ter 'articles' e 'articlesCount'."""
    resp = requests.get(f"{API_URL}/articles", timeout=15)
    assert resp.status_code == 200, f"Status inesperado: {resp.status_code}\nBody: {resp.text[:300]}"
    data = resp.json()
    assert "articles" in data and "articlesCount" in data

    # Se existir pelo menos 1 artigo, validar estrutura básica contra o schema
    articles = data["articles"]
    if articles:
        with open(_schema_path("article.json"), "r", encoding="utf-8") as f:
            base_schema = json.load(f)
        list_schema = {
            "type": "object",
            "required": ["article"],
            "properties": {
                "article": base_schema["properties"]["article"]
            }
        }
        validate(instance={"article": articles[0]}, schema=list_schema)

def test_create_article(auth_headers, article_schema):
    """Criar artigo autenticado e validar contrato."""
    article_data = {
        "article": {
            "title": "Test Article",
            "description": "This is a test article",
            "body": "Article content goes here",
            "tagList": ["test", "automation"]
        }
    }
    resp = requests.post(f"{API_URL}/articles", headers=auth_headers, json=article_data, timeout=15)
    # Algumas impl. devolvem 201 em vez de 200; aceitar ambos
    assert resp.status_code in (200, 201), f"Status: {resp.status_code}\nBody: {resp.text[:300]}"
    payload = resp.json()

    # Validar contrato com o schema completo
    validate(instance=payload, schema=article_schema)

    art = payload["article"]
    assert art["title"] == article_data["article"]["title"]
    assert art["description"] == article_data["article"]["description"]
    for tag in article_data["article"]["tagList"]:
        assert tag in art.get("tagList", [])
