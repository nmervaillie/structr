/**
 * Copyright (C) 2010-2016 Structr GmbH
 *
 * This file is part of Structr <http://structr.org>.
 *
 * Structr is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Structr is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Structr.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.structr.schema;

import org.structr.common.StructrTest;
import org.structr.common.error.FrameworkException;
import org.structr.core.entity.SchemaNode;
import org.structr.core.entity.SchemaRelationshipNode;
import org.structr.core.graph.Tx;
import org.structr.core.property.PropertyMap;
import org.structr.core.script.Scripting;
import org.structr.schema.action.ActionContext;
import static junit.framework.TestCase.fail;

public class RelationshipOverlapTest extends StructrTest {


	public void testInheritedRelationShipOverlap() {

		// setup phase: create schema nodes
		try (final Tx tx = app.tx()) {

			// create two nodes and associate them with each other
			final SchemaNode baseNode  = createTestNode(SchemaNode.class, "BaseClass");

			final SchemaNode subNode  = createTestNode(SchemaNode.class, "SubClass");
			subNode.setProperty(SchemaNode.extendsClass, "org.structr.dynamic.BaseClass");

			final SchemaNode orgaNode  = createTestNode(SchemaNode.class, "Organisation");

			final PropertyMap propertyMap = new PropertyMap();
			propertyMap.put(SchemaRelationshipNode.sourceId,       baseNode.getUuid());
			propertyMap.put(SchemaRelationshipNode.targetId,       orgaNode.getUuid());
			propertyMap.put(SchemaRelationshipNode.sourceJsonName, "maintainedbyOrgaBASE");
			propertyMap.put(SchemaRelationshipNode.targetJsonName, "maintainedbyOrgaBASE");
			propertyMap.put(SchemaRelationshipNode.sourceMultiplicity, "1");
			propertyMap.put(SchemaRelationshipNode.targetMultiplicity, "1");
			propertyMap.put(SchemaRelationshipNode.relationshipType, "maintainedBy");
			app.create(SchemaRelationshipNode.class, propertyMap);

			final PropertyMap propertyMap2 = new PropertyMap();
			propertyMap2.put(SchemaRelationshipNode.sourceId,       subNode.getUuid());
			propertyMap2.put(SchemaRelationshipNode.targetId,       orgaNode.getUuid());
			propertyMap2.put(SchemaRelationshipNode.sourceJsonName, "maintainedbyOrgaSUB");
			propertyMap2.put(SchemaRelationshipNode.targetJsonName, "maintainedbyOrgaSUB");
			propertyMap2.put(SchemaRelationshipNode.sourceMultiplicity, "1");
			propertyMap2.put(SchemaRelationshipNode.targetMultiplicity, "1");
			propertyMap2.put(SchemaRelationshipNode.relationshipType, "maintainedBy");
			app.create(SchemaRelationshipNode.class, propertyMap2);

			tx.success();

		} catch(FrameworkException fex) {

			fex.printStackTrace();
			fail("Unexpected exception.");
		}


		try (final Tx tx = app.tx()) {

			final ActionContext ctx = new ActionContext(securityContext, null);

			assertEquals("Relationship used twice!", "TEST OK", Scripting.replaceVariables(ctx, null, ""
					+ "${{"
					+ "    var subclassObject = Structr.create('SubClass');\n"
					+ "    var orgaObject = Structr.create('Organisation');\n"
					+ "    \n"
					+ "    subclassObject.maintainedbyOrgaSUB = orgaObject;\n"
					+ "    \n"
					+ "    if (subclassObject.maintainedbyOrgaBASE == null) {\n"
					+ "        return 'TEST OK';\n"
					+ "    } else {\n"
					+ "        return 'TEST NOT OK!' + (subclassObject.maintainedbyOrgaBASE.id == orgaObject.id ? ' rel/node is used twice!' : '');\n"
					+ "    }\n"
					+ "}}"
			));

			tx.success();

		} catch(FrameworkException fex) {

			fex.printStackTrace();
			fail("Unexpected exception.");
		}

	}

}
