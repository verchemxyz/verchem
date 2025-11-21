#!/usr/bin/env tsx

// VerChem - Comprehensive Validation Script
// Runs all validation tests and generates a report

import { runAllValidationTests } from '../lib/validation/validation-suite'
import * as fs from 'fs'
import * as path from 'path'

type ValidationRun = Awaited<ReturnType<typeof runAllValidationTests>>

async function main() {
  console.log('🧪 VerChem Validation Suite v1.0.0')
  console.log('==================================')
  console.log('Running comprehensive validation tests...\n')

  const startTime = Date.now()

  try {
    const results = await runAllValidationTests()

    // Print summary
    console.log('\n📊 VALIDATION SUMMARY')
    console.log('=====================')
    console.log(`Total Tests: ${results.summary.totalTests}`)
    console.log(`✅ Passed: ${results.summary.passed}`)
    console.log(`❌ Failed: ${results.summary.failed}`)
    console.log(`🏆 Excellent: ${results.summary.excellent}`)
    console.log(`✅ Good: ${results.summary.good}`)
    console.log(`⚠️  Acceptable: ${results.summary.acceptable}`)
    console.log(`Overall Score: ${results.summary.overallScore.toFixed(1)}%`)

    // Print detailed results by category
    console.log('\n📈 DETAILED RESULTS BY CATEGORY')
    console.log('================================')

    // Group results by category
    const categories = [...new Set(results.results.map(r => r.category))]

    for (const category of categories) {
      const categoryResults = results.results.filter(r => r.category === category)
      const categoryPassed = categoryResults.filter(r => r.passed).length
      const categoryFailed = categoryResults.length - categoryPassed
      const categoryScore = (categoryPassed / categoryResults.length) * 100

      console.log(`\n${category}:`)
      console.log(`  Tests: ${categoryResults.length}`)
      console.log(`  Passed: ${categoryPassed}`)
      console.log(`  Failed: ${categoryFailed}`)
      console.log(`  Pass Rate: ${categoryScore.toFixed(1)}%`)

      // Show failed tests
      const failedTests = categoryResults.filter(r => !r.passed)
      if (failedTests.length > 0) {
        console.log(`  ❌ Failures:`)
        failedTests.forEach((test) => {
          const expected = test.reference !== undefined ? test.reference.toFixed(4) : 'N/A'
          const calculated = test.calculated !== undefined ? test.calculated.toFixed(4) : 'N/A'
          const error = test.errorPercent !== undefined ? `${test.errorPercent.toFixed(2)}%` : 'N/A'
          console.log(`    - ${test.testName}: Expected ${expected}, Got ${calculated} (Error: ${error})`)
        })
      }
    }

    // Print recommendations
    if (results.recommendations && results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS')
      console.log('==================')
      results.recommendations.forEach((rec: string, index: number) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }

    // Generate HTML report
    const htmlReport = generateHTMLReport(results)
    const reportPath = path.join(process.cwd(), 'validation-report.html')
    fs.writeFileSync(reportPath, htmlReport)
    console.log(`\n📝 HTML report generated: ${reportPath}`)

    // Generate JSON report for programmatic use
    const jsonReport = JSON.stringify(results, null, 2)
    const jsonPath = path.join(process.cwd(), 'validation-results.json')
    fs.writeFileSync(jsonPath, jsonReport)
    console.log(`📋 JSON report generated: ${jsonPath}`)

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    console.log(`\n⏱️  Total time: ${duration} seconds`)

    // Exit code based on results
    if (results.summary.failed > 0) {
      console.log('\n❌ Validation failed! Please fix the issues above.')
      process.exit(1)
    } else if (results.summary.acceptable > 0) {
      console.log('\n⚠️  Validation passed but some tests only meet acceptable standards.')
      process.exit(0)
    } else {
      console.log('\n✅ All validation tests passed with excellent or good quality!')
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ Error running validation tests:', error)
    process.exit(1)
  }
}

function generateHTMLReport(results: ValidationRun): string {
  const timestamp = new Date().toISOString()
  const warnings = results.summary.acceptable
  const passRate = (results.summary.passed / results.summary.totalTests) * 100

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VerChem Validation Report - ${timestamp}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(to bottom right, #f0f9ff, #fefce8);
    }

    h1 {
      color: #1e40af;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }

    h2 {
      color: #1e3a8a;
      margin-top: 30px;
    }

    .summary {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .metric {
      text-align: center;
      padding: 10px;
      background: #f0f9ff;
      border-radius: 6px;
    }

    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
    }

    .metric-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .calculator-result {
      background: white;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .pass-rate {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 14px;
    }

    .pass-rate.excellent { background: #10b981; color: white; }
    .pass-rate.good { background: #3b82f6; color: white; }
    .pass-rate.warning { background: #f59e0b; color: white; }
    .pass-rate.fail { background: #ef4444; color: white; }

    .failure {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 8px;
      margin: 5px 0;
      font-size: 14px;
    }

    .warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 8px;
      margin: 5px 0;
      font-size: 14px;
    }

    .recommendation {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 10px;
      margin: 10px 0;
    }

    .timestamp {
      color: #6b7280;
      font-size: 14px;
      text-align: right;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      margin-left: 10px;
    }

    .badge.nist { background: #dbeafe; color: #1e40af; }
    .badge.crc { background: #fce7f3; color: #be185d; }
    .badge.iupac { background: #e9d5ff; color: #7c3aed; }
  </style>
</head>
<body>
  <h1>🧪 VerChem Validation Report</h1>

  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="metric">
        <div class="metric-value">${results.summary.totalTests}</div>
        <div class="metric-label">Total Tests</div>
      </div>
      <div class="metric">
        <div class="metric-value">${results.summary.passed}</div>
        <div class="metric-label">Passed</div>
      </div>
      <div class="metric">
        <div class="metric-value">${results.summary.failed}</div>
        <div class="metric-label">Failed</div>
      </div>
      <div class="metric">
        <div class="metric-value">${warnings}</div>
        <div class="metric-label">Warnings</div>
      </div>
      <div class="metric">
        <div class="metric-value">${passRate.toFixed(1)}%</div>
        <div class="metric-label">Pass Rate</div>
      </div>
      <div class="metric">
        <div class="metric-value">${results.summary.overallScore.toFixed(1)}</div>
        <div class="metric-label">Score /100</div>
      </div>
    </div>
  </div>

  <h2>Detailed Results by Category</h2>
  ${(() => {
    const categories = [...new Set(results.results.map((r) => r.category))]
    return categories.map(category => {
      const categoryResults = results.results.filter((r) => r.category === category)
      const categoryPassed = categoryResults.filter((r) => r.passed).length
      const categoryScore = (categoryPassed / categoryResults.length) * 100
      const failedTests = categoryResults.filter((r) => !r.passed)
      const failures = failedTests.length > 0 ? `
              <h4>❌ Failures:</h4>
              ${failedTests.map((f) => `
                <div class="failure">
                  <strong>${f.testName}:</strong> Expected ${f.reference.toFixed(4)}, Got ${f.calculated.toFixed(4)}
                  (Error: ${f.errorPercent.toFixed(2)}%)
                </div>
              `).join('')}
            ` : '<p>✅ All tests passed!</p>'

      return `
        <div class="calculator-result">
          <h3>${category}
            ${getValidationBadge(category.toLowerCase())}
            <span class="pass-rate ${getPassRateClass(categoryScore)}">${categoryScore.toFixed(1)}%</span>
          </h3>
          <p>Tests: ${categoryResults.length} | Passed: ${categoryPassed} | Failed: ${categoryResults.length - categoryPassed}</p>

          ${failures}
        </div>
      `
    }).join('')
  })()}

  ${results.recommendations && results.recommendations.length > 0 ? `
    <h2>💡 Recommendations</h2>
    ${results.recommendations.map((rec) => `
      <div class="recommendation">${rec}</div>
    `).join('')}
  ` : ''}

  <div class="timestamp">
    Generated: ${timestamp}<br>
    VerChem Validation Suite v1.0.0
  </div>
</body>
</html>`
}

function getPassRateClass(passRate: number): string {
  if (passRate >= 95) return 'excellent'
  if (passRate >= 80) return 'good'
  if (passRate >= 60) return 'warning'
  return 'fail'
}

function getValidationBadge(category: string): string {
  const badges: { [key: string]: string } = {
    'atomic masses': '<span class="badge iupac">IUPAC</span>',
    'ph calculations': '<span class="badge nist">NIST</span>',
    'gas laws': '<span class="badge nist">NIST</span>',
    'electrochemistry': '<span class="badge crc">CRC</span>',
    'buffer': '<span class="badge nist">NIST</span>',
    'thermodynamics': '<span class="badge crc">CRC</span>'
  }
  return badges[category.toLowerCase()] || ''
}

// Run the validation
main().catch(console.error)
