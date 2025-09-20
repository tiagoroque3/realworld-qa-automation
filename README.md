# RealWorld QA Automation Framework

A comprehensive test automation framework for the [RealWorld](https://github.com/gothinkster/realworld) application (Medium.com clone). This project demonstrates modern QA automation practices across multiple testing layers.

## 🎯 Testing Layers

### 1. End-to-End Testing (Playwright)
- UI automation using TypeScript and Playwright
- Cross-browser testing (Chrome, Firefox, Safari)
- Page Object Model pattern for maintainable tests
- Login functionality and article management tests

### 2. API Testing (Python)
- REST API automation using Python and pytest
- JSON Schema validation
- Test data management
- Comprehensive API coverage

### 3. Performance Testing (k6)
- Load testing scripts using k6
- Performance metrics collection
- Scalability testing
- Real-world usage scenarios

### 4. Accessibility Testing
- axe-core integration
- WCAG compliance checks
- Automated accessibility reports
- Cross-browser compatibility

## 🛠️ Technology Stack

- **E2E Testing**: Playwright, TypeScript
- **API Testing**: Python, pytest, requests
- **Performance**: k6, JavaScript
- **Accessibility**: axe-core
- **CI/CD**: GitHub Actions
- **Reporting**: Built-in reporters for each tool

## 📋 Prerequisites

- Node.js (Latest LTS)
- Python 3.11+
- k6

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/tiagoroque3/realworld-qa-automation.git
cd realworld-qa-automation
```

2. Install dependencies:
```bash
# UI Tests
npm install
npx playwright install

# API Tests
cd api-tests
python -m venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
# Create .env file with:
TEST_EMAIL=your_test_email
TEST_PASSWORD=your_test_password
API_URL=https://api.realworld.io
```

## 🧪 Running Tests

### UI Tests
```bash
npm run test:e2e     # Run E2E tests
npm run test:a11y    # Run accessibility tests
```

### API Tests
```bash
cd api-tests
pytest tests/
```

### Performance Tests
```bash
k6 run performance/scripts/articles.js
```

## 📊 Test Reports

- E2E Test reports: `playwright-report/`
- API Test reports: Generated with pytest
- Performance reports: k6 output
- Accessibility reports: Included in E2E reports

## 📝 Project Structure
```
realworld-qa-automation/
├── e2e-tests/               # UI tests
│   ├── pages/              # Page Objects
│   └── tests/              # Test files
├── api-tests/              # API testing
│   ├── schemas/           # JSON schemas
│   └── tests/            # Test files
└── performance/           # k6 tests
    └── scripts/          # Test scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details