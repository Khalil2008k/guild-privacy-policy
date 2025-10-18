
// AST-based Code Duplication Analysis
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { Project, Node, SyntaxKind } from 'ts-morph';

interface CodeBlock {
  hash: string;
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  nodeType: string;
}

interface Duplication {
  hash: string;
  blocks: CodeBlock[];
  similarity: number;
}

export class ASTDuplicationAnalyzer {
  private project: Project;
  private threshold: number = 0.8; // 80% similarity threshold

  constructor(projectPath: string) {
    this.project = new Project({
      tsConfigFilePath: path.join(projectPath, 'tsconfig.json'),
      skipAddingFilesFromTsConfig: false,
      skipFileDependencyResolution: false,
    });
  }

  async analyzeDuplication(): Promise<Duplication[]> {
    console.log('🔍 Analyzing AST-based code duplication...');

    const sourceFiles = this.project.getSourceFiles();
    const allBlocks: CodeBlock[] = [];

    // Extract code blocks from all source files
    for (const sourceFile of sourceFiles) {
      const blocks = this.extractCodeBlocks(sourceFile);
      allBlocks.push(...blocks);
    }

    console.log(`📊 Extracted ${allBlocks.length} code blocks for analysis`);

    // Find duplications
    const duplications = this.findDuplications(allBlocks);

    // Filter by similarity threshold
    const significantDuplications = duplications.filter(d => d.similarity >= this.threshold);

    console.log(`⚠️  Found ${significantDuplications.length} significant duplications`);

    // Generate refactoring suggestions
    await this.generateRefactoringSuggestions(significantDuplications);

    return significantDuplications;
  }

  private extractCodeBlocks(sourceFile: ts.SourceFile): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const filePath = sourceFile.getFilePath();

    const extractFromNode = (node: Node, parentType?: string) => {
      if (Node.isFunctionDeclaration(node) ||
          Node.isMethodDeclaration(node) ||
          Node.isClassDeclaration(node) ||
          Node.isInterfaceDeclaration(node) ||
          Node.isEnumDeclaration(node)) {

        const startLine = node.getStartLineNumber();
        const endLine = node.getEndLineNumber();
        const content = node.getText();
        const hash = this.generateHash(content);

        blocks.push({
          hash,
          content,
          filePath,
          startLine,
          endLine,
          nodeType: node.getKindName()
        });
      }

      node.forEachChild(child => extractFromNode(child, node.getKindName()));
    };

    extractFromNode(sourceFile);
    return blocks;
  }

  private findDuplications(blocks: CodeBlock[]): Duplication[] {
    const duplications: Duplication[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < blocks.length; i++) {
      const block1 = blocks[i];
      if (processed.has(block1.hash)) continue;

      const similarBlocks: CodeBlock[] = [block1];

      for (let j = i + 1; j < blocks.length; j++) {
        const block2 = blocks[j];
        if (processed.has(block2.hash)) continue;

        const similarity = this.calculateSimilarity(block1.content, block2.content);
        if (similarity >= this.threshold) {
          similarBlocks.push(block2);
          processed.add(block2.hash);
        }
      }

      if (similarBlocks.length > 1) {
        duplications.push({
          hash: block1.hash,
          blocks: similarBlocks,
          similarity: this.calculateSimilarity(
            similarBlocks[0].content,
            similarBlocks[1].content
          )
        });
      }

      processed.add(block1.hash);
    }

    return duplications;
  }

  private calculateSimilarity(content1: string, content2: string): number {
    // Simple similarity calculation based on token overlap
    const tokens1 = this.tokenize(content1);
    const tokens2 = this.tokenize(content2);

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  private tokenize(content: string): Set<string> {
    // Tokenize TypeScript/JavaScript code
    const tokens = new Set<string>();

    // Remove comments and strings
    const cleaned = content
      .replace(///.*$/gm, '')
      .replace(//*[sS]*?*//g, '')
      .replace(/".*?"/g, '')
      .replace(/'.*?'/g, '');

    // Extract identifiers, keywords, and operators
    const matches = cleaned.match(/\b\w+\b|[{}()\[\].,;:!?+-*/%=&|^~<>]/g) || [];
    matches.forEach(token => tokens.add(token));

    return tokens;
  }

  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async generateRefactoringSuggestions(duplications: Duplication[]): Promise<void> {
    const suggestions: string[] = [];

    for (const duplication of duplications) {
      const files = [...new Set(duplication.blocks.map(b => b.filePath))];

      if (files.length > 1) {
        suggestions.push(`\n🔄 Refactoring Suggestion for duplication ${duplication.hash}:`);
        suggestions.push(`   - Files: ${files.join(', ')}`);
        suggestions.push(`   - Blocks: ${duplication.blocks.length}`);
        suggestions.push(`   - Similarity: ${(duplication.similarity * 100).toFixed(1)}%`);
        suggestions.push(`   - Recommendation: Extract common functionality into shared utility`);
      }
    }

    if (suggestions.length > 0) {
      const reportPath = path.join(this.project.getDirectory('.').getPath(), 'duplication-analysis-report.md');
      fs.writeFileSync(reportPath, suggestions.join('\n'));
      console.log(`📋 Duplication analysis report generated: ${reportPath}`);
    }
  }
}

// CLI usage
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const analyzer = new ASTDuplicationAnalyzer(projectPath);

  analyzer.analyzeDuplication()
    .then(duplications => {
      console.log(`✅ AST duplication analysis completed. Found ${duplications.length} duplications.`);
    })
    .catch(error => {
      console.error('❌ AST duplication analysis failed:', error.message);
      process.exit(1);
    });
}







