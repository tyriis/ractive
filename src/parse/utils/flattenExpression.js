import { REFERENCE, BOOLEAN_LITERAL, GLOBAL, NUMBER_LITERAL, STRING_LITERAL, ARRAY_LITERAL, OBJECT_LITERAL, KEY_VALUE_PAIR, PREFIX_OPERATOR, INFIX_OPERATOR, INVOCATION, BRACKETED, MEMBER, REFINEMENT, CONDITIONAL } from 'config/types';
import { isObject } from 'utils/is';

export default function flattenExpression ( expression ) {
	var refs = [], flattened;

	extractRefs( expression, refs );

	flattened = {
		r: refs,
		s: stringify( expression, refs )
	};

	return flattened;
}

function quoteStringLiteral ( str ) {
	return JSON.stringify( String( str ) );
}

// TODO maybe refactor this?
function extractRefs ( node, refs ) {
	var i, list;

	if ( node.t === REFERENCE ) {
		if ( refs.indexOf( node.n ) === -1 ) {
			refs.unshift( node.n );
		}
	}

	list = node.o || node.m;
	if ( list ) {
		if ( isObject( list ) ) {
			extractRefs( list, refs );
		} else {
			i = list.length;
			while ( i-- ) {
				extractRefs( list[i], refs );
			}
		}
	}

	if ( node.x ) {
		extractRefs( node.x, refs );
	}

	if ( node.r ) {
		extractRefs( node.r, refs );
	}

	if ( node.v ) {
		extractRefs( node.v, refs );
	}
}

function stringify ( node, refs ) {
	var stringifyAll = function ( item ) {
		return stringify( item, refs );
	};

	switch ( node.t ) {
		case BOOLEAN_LITERAL:
		case GLOBAL:
		case NUMBER_LITERAL:
		return node.v;

		case STRING_LITERAL:
		return quoteStringLiteral(node.v);

		case ARRAY_LITERAL:
		return '[' + ( node.m ? node.m.map( stringifyAll ).join( ',' ) : '' ) + ']';

		case OBJECT_LITERAL:
		return '{' + ( node.m ? node.m.map( stringifyAll ).join( ',' ) : '' ) + '}';

		case KEY_VALUE_PAIR:
		return node.k + ':' + stringify( node.v, refs );

		case PREFIX_OPERATOR:
		return ( node.s === 'typeof' ? 'typeof ' : node.s ) + stringify( node.o, refs );

		case INFIX_OPERATOR:
		return stringify( node.o[0], refs ) + ( node.s.substr( 0, 2 ) === 'in' ? ' ' + node.s + ' ' : node.s ) + stringify( node.o[1], refs );

		case INVOCATION:
		return stringify( node.x, refs ) + '(' + ( node.o ? node.o.map( stringifyAll ).join( ',' ) : '' ) + ')';

		case BRACKETED:
		return '(' + stringify( node.x, refs ) + ')';

		case MEMBER:
		return stringify( node.x, refs ) + stringify( node.r, refs );

		case REFINEMENT:
		return ( node.n ? '.' + node.n : '[' + stringify( node.x, refs ) + ']' );

		case CONDITIONAL:
		return stringify( node.o[0], refs ) + '?' + stringify( node.o[1], refs ) + ':' + stringify( node.o[2], refs );

		case REFERENCE:
		return '_' + refs.indexOf( node.n );

		default:
		throw new Error( 'Expected legal JavaScript' );
	}
}
