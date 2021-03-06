/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {RuleFailure, Rules} from 'tslint';
import * as ts from 'typescript';

import {createHtmlSourceFile} from '../../../utils/tslint/tslint_html_source_file';
import {analyzeResolvedTemplate} from '../analyze_template';
import {NgComponentTemplateVisitor} from '../angular/ng_component_template';

const FAILURE_MESSAGE = 'Found assignment to template variable. This does not work with Ivy and ' +
    'needs to be updated.';

/**
 * Rule that reports if an Angular template contains property assignments to template variables.
 */
export class Rule extends Rules.TypedRule {
  applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): RuleFailure[] {
    const typeChecker = program.getTypeChecker();
    const templateVisitor = new NgComponentTemplateVisitor(typeChecker);
    const failures: RuleFailure[] = [];

    // Analyze the current source files by detecting all referenced HTML templates.
    templateVisitor.visitNode(sourceFile);

    const {resolvedTemplates} = templateVisitor;

    // Analyze each resolved template and print a warning for property writes to
    // template variables.
    resolvedTemplates.forEach((template, filePath) => {
      const nodes = analyzeResolvedTemplate(filePath, template);
      const templateFile =
          template.inline ? sourceFile : createHtmlSourceFile(filePath, template.content);

      if (!nodes) {
        return;
      }

      nodes.forEach(n => {
        failures.push(new RuleFailure(
            templateFile, template.start + n.start, template.start + n.end, FAILURE_MESSAGE,
            this.ruleName));
      });
    });

    return failures;
  }
}
