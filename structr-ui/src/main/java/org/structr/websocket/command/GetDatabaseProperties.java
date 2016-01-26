/**
 * Copyright (C) 2010-2016 Structr GmbH
 *
 * This file is part of Structr <http://structr.org>.
 *
 * Structr is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Structr is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Structr.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.structr.websocket.command;

import java.util.HashMap;
import java.util.Map;
import org.structr.core.GraphObject;
import org.structr.websocket.StructrWebSocket;
import org.structr.websocket.message.MessageBuilder;
import org.structr.websocket.message.WebSocketMessage;

//~--- classes ----------------------------------------------------------------
/**
 *
 *
 */
public class GetDatabaseProperties extends AbstractCommand {

	static {

		StructrWebSocket.addCommand(GetDatabaseProperties.class);

	}

	@Override
	public void processMessage(final WebSocketMessage webSocketData) {

		final GraphObject obj = getGraphObject(webSocketData.getId());

		if (obj != null) {

			final Iterable<String> keys = obj.getPropertyContainer().getPropertyKeys();

			final Map<String, Object> data = new HashMap<>();
			for (final String key : keys) {
				data.put(key, obj.getPropertyContainer().getProperty(key));
			}

			webSocketData.setNodeData(data);

			// send only over local connection (no broadcast)
			getWebSocket().send(webSocketData, true);

		} else {

			getWebSocket().send(MessageBuilder.status().code(404).build(), true);

		}
	}

	//~--- get methods ----------------------------------------------------
	@Override
	public String getCommand() {
		return "GET_DATABASE_PROPERTIES";
	}
}
