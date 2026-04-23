# frozen_string_literal: true

# Sidebar converter.
# Generated via `jui g converter --from docs/components/json/sidebar.component.json`.
#
# Hand-adjustments after scaffold:
#   - Every `@{binding}` branch routes through `add_viewmodel_data_prefix(...)`
#     so `@{foo}` resolves to `data.foo`. Scaffold's default emission leaves the
#     name bare, which only compiles if a local `foo` happens to be in scope.
#   - `build_class_name` drops the scaffold's auto-inserted `flex flex-col`
#     wrapper — Sidebar owns its own layout chrome via CSS (aside element +
#     data-mobile-open transforms).
#   - Added `onToggleSection` and `onLinkTap` event-prop emission via
#     `emit_event_prop`. Scaffold does not emit events.
#   - `emit_array_prop` wraps JSON.generate in `rewrite_json_string_values`
#     so any literal snake_case strings inside the items array auto-resolve
#     through StringManager (same pattern as the TOC converter).
#
# This file is NOT marked @generated — editing is expected. The spec is the
# source of truth for the prop CONTRACT; the React component owns rendering.

require 'json'
require_relative '../base_converter'

module RjuiTools
  module React
    module Converters
      module Extensions
        class SidebarConverter < BaseConverter
          def convert(indent = 2)
            class_name = build_class_name
            id_attr = extract_id ? %( id="#{extract_id}") : ''

            props = []
            emit_array_prop(props, 'items',          json['items'])
            emit_string_prop(props, 'activeUrl',     json['activeUrl'])
            emit_array_prop(props, 'collapsedIds',   json['collapsedIds'])
            emit_bool_prop(props,   'mobileOpen',    json['mobileOpen'])
            emit_event_prop(props,  'onToggleSection', json['onToggleSection'])
            emit_event_prop(props,  'onLinkTap',       json['onLinkTap'])

            props_str = props.empty? ? '' : " #{props.join(' ')}"

            # Sidebar is a leaf — spec declares no slots.
            <<~JSX.chomp
              #{indent_str(indent)}<Sidebar#{id_attr} className="#{class_name}"#{props_str} />
            JSX
          end

          protected

          def build_class_name
            # Sidebar owns its own visual chrome (<aside>, CSS transforms,
            # width, scroll container). No flex wrapper injected here.
            super.to_s
          end

          private

          def binding?(value)
            value.is_a?(String) && value.start_with?('@{') && value.end_with?('}')
          end

          def binding_ref(value)
            add_viewmodel_data_prefix(value[2..-2])
          end

          def emit_string_prop(props, key, value)
            return if value.nil?
            if binding?(value)
              props << "#{key}={#{binding_ref(value)}}"
            elsif (resolved = convert_string_key(value))
              props << "#{key}=#{resolved}"
            else
              escaped = value.to_s.gsub('\\') { '\\\\' }.gsub('`') { '\\`' }.gsub('${') { '\\${' }
              props << "#{key}={`#{escaped}`}"
            end
          end

          def emit_bool_prop(props, key, value)
            return if value.nil?
            if binding?(value)
              props << "#{key}={#{binding_ref(value)}}"
            else
              props << "#{key}={#{value ? 'true' : 'false'}}"
            end
          end

          def emit_array_prop(props, key, value)
            return if value.nil?
            if binding?(value)
              props << "#{key}={#{binding_ref(value)}}"
            else
              # Rewrite resolvable snake_case strings in the JSON payload;
              # unregistered identifiers (like section ids, urls) stay literal.
              props << "#{key}={#{rewrite_json_string_values(JSON.generate(value))}}"
            end
          end

          def emit_event_prop(props, key, value)
            return if value.nil?
            # onToggleSection / onLinkTap MUST be @{handler} bindings; inline
            # function bodies are not supported (same contract as the TOC's onSelect).
            return unless binding?(value)
            props << "#{key}={#{binding_ref(value)}}"
          end
        end
      end
    end
  end
end
