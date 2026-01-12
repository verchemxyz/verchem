import jsPDF from 'jspdf';
import {
  TreatmentUnit,
  WastewaterQuality,
  ThaiEffluentType,
  THAI_EFFLUENT_STANDARDS,
  UNIT_METADATA
} from '../types/wastewater-treatment';

export interface ComplianceData {
  overall: 'pass' | 'fail' | 'unknown';
  parameters: {
    parameter: string;
    actual?: number;
    limit?: number | string;
    unit: string;
    status: 'pass' | 'fail' | 'unknown';
  }[];
}

export interface WastewaterReportData {
  projectName: string;
  projectLocation?: string;
  designFlow: number;
  influentQuality: WastewaterQuality;
  treatmentTrain: TreatmentUnit[];
  effluentStandard: ThaiEffluentType;
  compliance: ComplianceData;
  generatedDate?: Date;
}

interface TableRow {
  cells: string[];
  isHeader?: boolean;
  bgColor?: [number, number, number];
}

export class WastewaterReportExporter {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 40;
  private currentY = 0;
  private lineHeight = 14;
  private primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  private successColor: [number, number, number] = [34, 197, 94]; // Green
  private warningColor: [number, number, number] = [234, 179, 8]; // Yellow
  private dangerColor: [number, number, number] = [239, 68, 68]; // Red

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.currentY = this.margin;
  }

  async generateReport(data: WastewaterReportData): Promise<Blob> {
    // Page 1: Cover & Summary
    this.addCoverPage(data);

    // Page 2: Influent Quality & Design Parameters
    this.pdf.addPage();
    this.currentY = this.margin;
    this.addInfluentSection(data);

    // Page 3+: Treatment Train Details
    this.pdf.addPage();
    this.currentY = this.margin;
    this.addTreatmentTrainSection(data);

    // Final Page: Compliance & Conclusions
    this.pdf.addPage();
    this.currentY = this.margin;
    this.addComplianceSection(data);

    // Add page numbers
    this.addPageNumbers();

    return this.pdf.output('blob');
  }

  private addCoverPage(data: WastewaterReportData): void {
    const centerX = this.pageWidth / 2;

    // Header bar
    this.pdf.setFillColor(...this.primaryColor);
    this.pdf.rect(0, 0, this.pageWidth, 120, 'F');

    // Logo/Title
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(32);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('WASTEWATER TREATMENT', centerX, 50, { align: 'center' });
    this.pdf.setFontSize(24);
    this.pdf.text('DESIGN REPORT', centerX, 85, { align: 'center' });

    // Project info box
    this.currentY = 160;
    this.pdf.setTextColor(0, 0, 0);

    // Project name
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(data.projectName || 'Wastewater Treatment Plant', centerX, this.currentY, { align: 'center' });

    if (data.projectLocation) {
      this.currentY += 30;
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(data.projectLocation, centerX, this.currentY, { align: 'center' });
    }

    // Summary box
    this.currentY = 280;
    this.addSummaryBox(data);

    // Treatment train visual
    this.currentY = 480;
    this.addTreatmentTrainVisual(data);

    // Footer
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(128, 128, 128);
    const dateStr = (data.generatedDate || new Date()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.pdf.text(`Generated: ${dateStr}`, centerX, this.pageHeight - 60, { align: 'center' });
    this.pdf.text('Powered by VerChem - verchem.xyz', centerX, this.pageHeight - 45, { align: 'center' });
  }

  private addSummaryBox(data: WastewaterReportData): void {
    const boxX = this.margin;
    const boxWidth = this.pageWidth - 2 * this.margin;
    const boxHeight = 160;

    // Box background
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.roundedRect(boxX, this.currentY, boxWidth, boxHeight, 8, 8, 'F');

    // Box border
    this.pdf.setDrawColor(226, 232, 240);
    this.pdf.roundedRect(boxX, this.currentY, boxWidth, boxHeight, 8, 8, 'S');

    // Title
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('PROJECT SUMMARY', boxX + 20, this.currentY + 25);

    // Summary content
    const contentY = this.currentY + 50;
    const col1X = boxX + 20;
    const col2X = boxX + boxWidth / 2 + 20;

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    // Column 1
    this.addSummaryItem(col1X, contentY, 'Design Flow', `${data.designFlow.toLocaleString()} m³/day`);
    this.addSummaryItem(col1X, contentY + 30, 'Treatment Units', `${data.treatmentTrain.length} units`);
    this.addSummaryItem(col1X, contentY + 60, 'Influent BOD', `${data.influentQuality.bod} mg/L`);
    this.addSummaryItem(col1X, contentY + 90, 'Influent COD', `${data.influentQuality.cod} mg/L`);

    // Column 2
    const standard = THAI_EFFLUENT_STANDARDS[data.effluentStandard];
    this.addSummaryItem(col2X, contentY, 'Effluent Standard', standard?.name || data.effluentStandard);

    const lastUnit = data.treatmentTrain[data.treatmentTrain.length - 1];
    const effluentBOD = lastUnit?.outputQuality.bod || data.influentQuality.bod;
    const effluentCOD = lastUnit?.outputQuality.cod || data.influentQuality.cod;

    this.addSummaryItem(col2X, contentY + 30, 'Effluent BOD', `${effluentBOD.toFixed(1)} mg/L`);
    this.addSummaryItem(col2X, contentY + 60, 'Effluent COD', `${effluentCOD.toFixed(1)} mg/L`);

    // Compliance status
    const statusColor = data.compliance.overall === 'pass' ? this.successColor :
                        data.compliance.overall === 'fail' ? this.dangerColor : this.warningColor;
    this.pdf.setTextColor(...statusColor);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Compliance:', col2X, contentY + 90);
    this.pdf.text(data.compliance.overall.toUpperCase(), col2X + 70, contentY + 90);
  }

  private addSummaryItem(x: number, y: number, label: string, value: string): void {
    this.pdf.setTextColor(107, 114, 128);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(label + ':', x, y);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(value, x + 100, y);
  }

  private addTreatmentTrainVisual(data: WastewaterReportData): void {
    const boxX = this.margin;
    const boxWidth = this.pageWidth - 2 * this.margin;

    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('TREATMENT TRAIN', boxX, this.currentY);

    this.currentY += 20;

    // Draw flow diagram
    const unitWidth = 80;
    const unitHeight = 40;
    const arrowWidth = 30;
    const startX = boxX;
    let currentX = startX;

    // Influent
    this.pdf.setFillColor(59, 130, 246);
    this.pdf.roundedRect(currentX, this.currentY, 60, unitHeight, 4, 4, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Influent', currentX + 30, this.currentY + 24, { align: 'center' });

    currentX += 60 + 10;

    // Treatment units (show max 5 for space)
    const unitsToShow = data.treatmentTrain.slice(0, 5);

    for (let i = 0; i < unitsToShow.length; i++) {
      const unit = unitsToShow[i];
      const meta = UNIT_METADATA[unit.type];

      // Arrow
      this.pdf.setDrawColor(156, 163, 175);
      this.pdf.setLineWidth(1);
      this.pdf.line(currentX, this.currentY + unitHeight / 2, currentX + arrowWidth - 5, this.currentY + unitHeight / 2);
      // Arrow head
      this.pdf.triangle(
        currentX + arrowWidth, this.currentY + unitHeight / 2,
        currentX + arrowWidth - 8, this.currentY + unitHeight / 2 - 4,
        currentX + arrowWidth - 8, this.currentY + unitHeight / 2 + 4,
        'F'
      );

      currentX += arrowWidth;

      // Unit box
      const statusColor = unit.status === 'pass' ? this.successColor :
                          unit.status === 'warning' ? this.warningColor : this.dangerColor;
      this.pdf.setFillColor(...statusColor);
      this.pdf.roundedRect(currentX, this.currentY, unitWidth, unitHeight, 4, 4, 'F');

      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'bold');

      // Truncate name if needed
      const name = (meta?.name || unit.type).substring(0, 12);
      this.pdf.text(name, currentX + unitWidth / 2, this.currentY + 18, { align: 'center' });

      this.pdf.setFontSize(6);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(`BOD: ${unit.outputQuality.bod.toFixed(0)}`, currentX + unitWidth / 2, this.currentY + 32, { align: 'center' });

      currentX += unitWidth;
    }

    // Show "..." if more units
    if (data.treatmentTrain.length > 5) {
      this.pdf.setTextColor(107, 114, 128);
      this.pdf.setFontSize(12);
      this.pdf.text(`... +${data.treatmentTrain.length - 5} more`, currentX + 20, this.currentY + 24);
    }

    // Final arrow to effluent
    currentX += 10;
    this.pdf.setDrawColor(156, 163, 175);
    this.pdf.line(currentX, this.currentY + unitHeight / 2, currentX + arrowWidth - 5, this.currentY + unitHeight / 2);
    this.pdf.triangle(
      currentX + arrowWidth, this.currentY + unitHeight / 2,
      currentX + arrowWidth - 8, this.currentY + unitHeight / 2 - 4,
      currentX + arrowWidth - 8, this.currentY + unitHeight / 2 + 4,
      'F'
    );

    currentX += arrowWidth;

    // Effluent
    const effluentColor = data.compliance.overall === 'pass' ? this.successColor : this.dangerColor;
    this.pdf.setFillColor(...effluentColor);
    this.pdf.roundedRect(currentX, this.currentY, 60, unitHeight, 4, 4, 'F');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Effluent', currentX + 30, this.currentY + 24, { align: 'center' });
  }

  private addInfluentSection(data: WastewaterReportData): void {
    this.addSectionTitle('INFLUENT CHARACTERISTICS');

    const rows: TableRow[] = [
      { cells: ['Parameter', 'Value', 'Unit', 'Typical Range'], isHeader: true, bgColor: [59, 130, 246] },
      { cells: ['Flow Rate', data.designFlow.toLocaleString(), 'm³/day', '-'] },
      { cells: ['BOD₅', data.influentQuality.bod.toString(), 'mg/L', '150-400'] },
      { cells: ['COD', data.influentQuality.cod.toString(), 'mg/L', '300-800'] },
      { cells: ['TSS', data.influentQuality.tss.toString(), 'mg/L', '150-350'] },
      { cells: ['pH', data.influentQuality.ph?.toString() || '-', '-', '6.5-8.5'] },
      { cells: ['Temperature', data.influentQuality.temperature?.toString() || '-', '°C', '20-35'] },
      { cells: ['TKN', data.influentQuality.tkn?.toString() || '-', 'mg/L', '25-50'] },
      { cells: ['Total P', data.influentQuality.totalP?.toString() || '-', 'mg/L', '4-12'] },
      { cells: ['Oil & Grease', data.influentQuality.oilGrease?.toString() || '-', 'mg/L', '50-150'] },
    ];

    this.addTable(rows, [150, 100, 80, 120]);

    // BOD/COD ratio analysis
    this.currentY += 30;
    const bodCodRatio = data.influentQuality.bod / data.influentQuality.cod;
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(`BOD/COD Ratio: ${bodCodRatio.toFixed(2)}`, this.margin, this.currentY);

    this.currentY += 15;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);

    let biodegradability = '';
    if (bodCodRatio >= 0.5) {
      biodegradability = 'Highly biodegradable - suitable for biological treatment';
      this.pdf.setTextColor(...this.successColor);
    } else if (bodCodRatio >= 0.3) {
      biodegradability = 'Moderately biodegradable - biological treatment feasible';
      this.pdf.setTextColor(...this.warningColor);
    } else {
      biodegradability = 'Low biodegradability - consider pretreatment or physicochemical processes';
      this.pdf.setTextColor(...this.dangerColor);
    }
    this.pdf.text(biodegradability, this.margin, this.currentY);
  }

  private addTreatmentTrainSection(data: WastewaterReportData): void {
    this.addSectionTitle('TREATMENT TRAIN DETAILS');

    for (let i = 0; i < data.treatmentTrain.length; i++) {
      const unit = data.treatmentTrain[i];
      const meta = UNIT_METADATA[unit.type];

      // Check if we need a new page
      if (this.currentY > this.pageHeight - 200) {
        this.pdf.addPage();
        this.currentY = this.margin;
      }

      // Unit header
      this.pdf.setFillColor(248, 250, 252);
      this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 4, 4, 'F');

      const statusColor = unit.status === 'pass' ? this.successColor :
                          unit.status === 'warning' ? this.warningColor : this.dangerColor;
      this.pdf.setFillColor(...statusColor);
      this.pdf.circle(this.margin + 15, this.currentY + 12.5, 6, 'F');

      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(`${i + 1}. ${meta?.name || unit.type}`, this.margin + 30, this.currentY + 17);

      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(107, 114, 128);
      this.pdf.text(`Category: ${meta?.category || 'N/A'}`, this.pageWidth - this.margin - 120, this.currentY + 17);

      this.currentY += 35;

      // Performance table
      const perfRows: TableRow[] = [
        { cells: ['Parameter', 'Influent', 'Effluent', 'Removal %'], isHeader: true, bgColor: [107, 114, 128] },
        {
          cells: [
            'BOD₅',
            `${unit.inputQuality.bod.toFixed(1)} mg/L`,
            `${unit.outputQuality.bod.toFixed(1)} mg/L`,
            `${unit.removalEfficiency.bod.toFixed(1)}%`
          ]
        },
        {
          cells: [
            'COD',
            `${unit.inputQuality.cod.toFixed(1)} mg/L`,
            `${unit.outputQuality.cod.toFixed(1)} mg/L`,
            `${unit.removalEfficiency.cod.toFixed(1)}%`
          ]
        },
        {
          cells: [
            'TSS',
            `${unit.inputQuality.tss.toFixed(1)} mg/L`,
            `${unit.outputQuality.tss.toFixed(1)} mg/L`,
            `${unit.removalEfficiency.tss.toFixed(1)}%`
          ]
        },
      ];

      this.addTable(perfRows, [100, 100, 100, 100]);

      // Issues
      if (unit.issues.length > 0) {
        this.currentY += 10;
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setTextColor(0, 0, 0);
        this.pdf.text('Design Issues:', this.margin, this.currentY);
        this.currentY += 15;

        for (const issue of unit.issues.slice(0, 3)) { // Show max 3 issues
          const issueColor = issue.severity === 'critical' ? this.dangerColor :
                             issue.severity === 'warning' ? this.warningColor : [107, 114, 128] as [number, number, number];
          this.pdf.setTextColor(...issueColor);
          this.pdf.setFont('helvetica', 'normal');
          this.pdf.text(`• ${issue.message}`, this.margin + 10, this.currentY);
          if (issue.suggestion) {
            this.currentY += 12;
            this.pdf.setTextColor(107, 114, 128);
            this.pdf.text(`  Suggestion: ${issue.suggestion}`, this.margin + 10, this.currentY);
          }
          this.currentY += 15;
        }
      }

      this.currentY += 20;
    }
  }

  private addComplianceSection(data: WastewaterReportData): void {
    this.addSectionTitle('EFFLUENT COMPLIANCE');

    const standard = THAI_EFFLUENT_STANDARDS[data.effluentStandard];
    const lastUnit = data.treatmentTrain[data.treatmentTrain.length - 1];
    const effluentQuality = lastUnit?.outputQuality || data.influentQuality;

    // Standard info
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(`Effluent Standard: ${standard?.name || data.effluentStandard}`, this.margin, this.currentY);
    this.currentY += 20;

    if (standard?.source) {
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(107, 114, 128);
      this.pdf.text(`Source: ${standard.source}`, this.margin, this.currentY);
      this.currentY += 25;
    }

    // Compliance table
    const complianceRows: TableRow[] = [
      { cells: ['Parameter', 'Limit', 'Achieved', 'Status'], isHeader: true, bgColor: [59, 130, 246] },
    ];

    for (const param of data.compliance.parameters) {
      const statusText = param.status === 'pass' ? 'PASS' :
                         param.status === 'fail' ? 'FAIL' : 'N/A';
      complianceRows.push({
        cells: [
          param.parameter,
          param.limit !== undefined ? `${param.limit} ${param.unit}` : '-',
          param.actual !== undefined ? `${param.actual.toFixed(1)} ${param.unit}` : '-',
          statusText
        ],
        bgColor: param.status === 'pass' ? [220, 252, 231] :
                 param.status === 'fail' ? [254, 226, 226] : [248, 250, 252]
      });
    }

    this.addTable(complianceRows, [120, 100, 100, 80]);

    // Overall compliance
    this.currentY += 30;
    const overallColor = data.compliance.overall === 'pass' ? this.successColor : this.dangerColor;

    this.pdf.setFillColor(...overallColor);
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 50, 8, 8, 'F');

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(
      `OVERALL COMPLIANCE: ${data.compliance.overall.toUpperCase()}`,
      this.pageWidth / 2,
      this.currentY + 30,
      { align: 'center' }
    );

    // Recommendations
    this.currentY += 80;
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('RECOMMENDATIONS', this.margin, this.currentY);
    this.currentY += 20;

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');

    const recommendations: string[] = [];

    if (data.compliance.overall === 'pass') {
      recommendations.push('The treatment system meets all regulatory requirements.');
      recommendations.push('Regular monitoring and maintenance is recommended to ensure consistent performance.');
    } else {
      recommendations.push('The treatment system does not meet all regulatory requirements.');

      for (const param of data.compliance.parameters) {
        if (param.status === 'fail') {
          recommendations.push(`Consider additional treatment for ${param.parameter} reduction.`);
        }
      }
    }

    for (const rec of recommendations) {
      this.pdf.text(`• ${rec}`, this.margin + 10, this.currentY);
      this.currentY += 15;
    }
  }

  private addSectionTitle(title: string): void {
    this.pdf.setFillColor(...this.primaryColor);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 30, 'F');

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin + 15, this.currentY + 20);

    this.currentY += 45;
  }

  private addTable(rows: TableRow[], colWidths: number[]): void {
    const tableX = this.margin;
    const rowHeight = 22;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let cellX = tableX;

      // Row background
      if (row.isHeader) {
        this.pdf.setFillColor(...(row.bgColor || this.primaryColor));
      } else if (row.bgColor) {
        this.pdf.setFillColor(...row.bgColor);
      } else {
        this.pdf.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      }

      this.pdf.rect(tableX, this.currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');

      // Cells
      for (let j = 0; j < row.cells.length; j++) {
        // Cell border
        this.pdf.setDrawColor(226, 232, 240);
        this.pdf.rect(cellX, this.currentY, colWidths[j], rowHeight, 'S');

        // Cell text
        if (row.isHeader) {
          this.pdf.setTextColor(255, 255, 255);
          this.pdf.setFont('helvetica', 'bold');
        } else {
          this.pdf.setTextColor(0, 0, 0);
          this.pdf.setFont('helvetica', 'normal');
        }
        this.pdf.setFontSize(9);
        this.pdf.text(row.cells[j], cellX + 8, this.currentY + 15);

        cellX += colWidths[j];
      }

      this.currentY += rowHeight;
    }
  }

  private addPageNumbers(): void {
    const totalPages = this.pdf.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(128, 128, 128);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(
        `Page ${i} of ${totalPages}`,
        this.pageWidth / 2,
        this.pageHeight - 25,
        { align: 'center' }
      );
    }
  }

  static async exportReport(data: WastewaterReportData, filename?: string): Promise<void> {
    const exporter = new WastewaterReportExporter();
    const blob = await exporter.generateReport(data);

    const finalFilename = filename || `wastewater_report_${new Date().toISOString().split('T')[0]}.pdf`;

    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
