import { Expression } from '../expression/expression.js'
import { JoinNode } from '../operation-node/join-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  parseOn,
  parseReferentialComparison,
} from '../parser/binary-operation-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import {
  ExistsExpression,
  parseExists,
  parseNotExists,
} from '../parser/unary-operation-parser.js'
import { freeze } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { SqlBool } from '../util/type-utils.js'
import { OnExpressionBuilder } from './deprecated-on-expression-builder.js'

export class JoinBuilder<DB, TB extends keyof DB>
  implements OperationNodeSource
{
  readonly #props: JoinBuilderProps

  constructor(props: JoinBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Just like {@link WhereInterface.where} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link WhereInterface.where} for documentation and examples.
   */
  on<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): JoinBuilder<DB, TB>

  on(factory: OnExpressionFactory<DB, TB>): JoinBuilder<DB, TB>
  on(expression: Expression<any>): JoinBuilder<DB, TB>

  on(...args: any[]): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(this.#props.joinNode, parseOn(args)),
    })
  }

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOn<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): JoinBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOn(factory: OnExpressionFactory<DB, TB>): JoinBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOn(expression: Expression<any>): JoinBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOn(...args: any[]): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOrOn(this.#props.joinNode, parseOn(args)),
    })
  }

  /**
   * Just like {@link WhereInterface.whereRef} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link WhereInterface.whereRef} for documentation and examples.
   */
  onRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(
        this.#props.joinNode,
        parseReferentialComparison(lhs, op, rhs)
      ),
    })
  }

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOnRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOrOn(
        this.#props.joinNode,
        parseReferentialComparison(lhs, op, rhs)
      ),
    })
  }

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  onExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(this.#props.joinNode, parseExists(arg)),
    })
  }

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  onNotExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(this.#props.joinNode, parseNotExists(arg)),
    })
  }

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOnExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOrOn(this.#props.joinNode, parseExists(arg)),
    })
  }

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOnNotExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOrOn(
        this.#props.joinNode,
        parseNotExists(arg)
      ),
    })
  }

  /**
   * Adds `on true`.
   */
  onTrue(): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(
        this.#props.joinNode,
        RawNode.createWithSql('true')
      ),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): JoinNode {
    return this.#props.joinNode
  }
}

preventAwait(
  JoinBuilder,
  "don't await JoinBuilder instances. They are never executed directly and are always just a part of a query."
)

export interface JoinBuilderProps {
  readonly joinNode: JoinNode
}

type OnExpressionFactory<DB, TB extends keyof DB> = (
  eb: OnExpressionBuilder<DB, TB>
) => Expression<SqlBool> | OnExpressionBuilder<DB, TB>
