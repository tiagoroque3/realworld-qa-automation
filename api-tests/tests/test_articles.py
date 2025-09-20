import os
import json
import pytest
import requests
from jsonschema import validate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_URL = os.getenv('API_URL', 'https://api.realworld.io/api')
TEST_EMAIL = os.getenv('API_TEST_EMAIL')
TEST_PASSWORD = os.getenv('API_TEST_PASSWORD')

@pytest.fixture
def auth_headers():
    """Get authentication token and return headers for authenticated requests."""
    response = requests.post(f"{API_URL}/users/login", json={
        "user": {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
    })
    token = response.json()['user']['token']
    return {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }

@pytest.fixture
def article_schema():
    """Load article JSON schema."""
    schema_path = os.path.join(os.path.dirname(__file__), '../schemas/article.json')
    with open(schema_path) as f:
        return json.load(f)

def test_create_article(auth_headers, article_schema):
    """Test creating a new article."""
    article_data = {
        "article": {
            "title": "Test Article",
            "description": "This is a test article",
            "body": "Article content goes here",
            "tagList": ["test", "automation"]
        }
    }
    
    response = requests.post(
        f"{API_URL}/articles",
        headers=auth_headers,
        json=article_data
    )
    
    assert response.status_code == 200
    validate(instance=response.json(), schema=article_schema)
    
    # Verify the article data
    article = response.json()['article']
    assert article['title'] == article_data['article']['title']
    assert article['description'] == article_data['article']['description']
    assert all(tag in article['tagList'] for tag in article_data['article']['tagList'])

def test_get_articles():
    """Test getting list of articles."""
    response = requests.get(f"{API_URL}/articles")
    
    assert response.status_code == 200
    assert 'articles' in response.json()
    assert 'articlesCount' in response.json()
    
    # Verify the structure of the first article if any exists
    articles = response.json()['articles']
    if articles:
        article_schema_path = os.path.join(os.path.dirname(__file__), '../schemas/article.json')
        with open(article_schema_path) as f:
            list_schema = {
                "type": "object",
                "required": ["article"],
                "properties": {
                    "article": json.load(f)["properties"]["article"]
                }
            }
        validate(instance={"article": articles[0]}, schema=list_schema)