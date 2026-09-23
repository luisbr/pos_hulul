class Api::Portal::AuditEventsController < ApplicationController
  before_action :require_portal_business!
  before_action -> { require_permission!("view_audit_events") }, only: :index

  def index
    events = business.audit_events.includes(:actor).recent.limit(100)
    events = events.where(event_type: params[:event_type]) if params[:event_type].present?

    render json: events.map { |event| event_json(event) }
  end

  private

  def business
    portal_business
  end

  def event_json(event)
    {
      id: event.id,
      event_type: event.event_type,
      auditable_type: event.auditable_type,
      auditable_id: event.auditable_id,
      metadata: event.metadata,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      created_at: event.created_at.iso8601,
      actor: event.actor && {
        id: event.actor.id,
        name: event.actor.name,
        email: event.actor.email
      }
    }
  end
end
