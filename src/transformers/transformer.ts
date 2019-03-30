import * as ts from 'typescript';

export interface MyPluginOptions {
    some?: string
}

function createImportStatement(libs: string[], ver) {
    var left = `{ ${libs.join(',')} }`;
    return [...libs.map((name) => {
        return ts.createAssignment(
            ts.createIdentifier(`imports.gi.versions.${name}`),
            ts.createIdentifier(ver)
        )
    }),
    ts.createVariableStatement([], [
        ts.createVariableDeclaration(
            left,
            ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            ts.createIdentifier('imports.gi')
        ),
    ]
    )]
}

export default function myTransformerPlugin(program: ts.Program, opts: MyPluginOptions) {
    return {
        before(ctx: ts.TransformationContext) {
            return (sourceFile: ts.SourceFile) => {
                function visitor(node: ts.Node): ts.Node | ts.Node[] {

                    if (ts.isImportDeclaration(node)) {
                        var m = node.moduleSpecifier.getText().match(/(gi)-([0-9]+(.[0-9]+)*)?/);
                        if (m) {
                            var libs = [];
                            if(node.importClause.namedBindings.kind == ts.SyntaxKind.NamedImports){
                                node.importClause.namedBindings.forEachChild((node: ts.ImportSpecifier) => {
                                    libs.push(node.name.getText());
                                });
                            }
                            else {
                                libs.push(node.importClause.namedBindings.name.getText());
                            }
                            return createImportStatement(libs, m[2])
                        }
                    }

                    if(ts.isNewExpression(node) && node.expression){
                        return ts.createNew(node.expression, node.typeArguments, node.arguments);
                    }

                    return ts.visitEachChild(node, visitor, ctx)
                }
                return ts.visitEachChild(sourceFile, visitor, ctx)
            }
        }
    }
}