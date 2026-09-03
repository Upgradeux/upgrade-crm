'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { TeamMember, UserRole } from '@/types/crm';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import { Modal } from '../ui/Modal';
import {
  IconUsers,
  IconUserPlus,
  IconSearch,
  IconMail,
  IconPhone,
  IconTrash,
  IconCalendar,
  IconCheck,
  IconCopy,
  IconBuilding,
  IconTrophy,
  IconPlus,
  IconBrandWhatsapp,
} from '@tabler/icons-react';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { getStatusIcon } from '../ui/LiveTeamPresenceWidget';

export function TeamView() {
  const {
    teamMembers,
    leads,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    setCurrentView,
    setFilters,
    currency,
    timezone,
    addToast,
  } = useCRM();

  const roleOptions = [
    { value: 'Founder', label: 'Founder' },
    { value: 'Co-Founder', label: 'Co-Founder' },
    { value: 'Cold Caller', label: 'Cold Caller' },
    { value: 'Developer', label: 'Developer' },
  ];

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Invite Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Cold Caller');
  const [phone, setPhone] = useState('');
  const [calComLink, setCalComLink] = useState('');

  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || m.role.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const colors = [
      'from-cyan-500 to-blue-600',
      'from-purple-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-rose-600',
    ];

    addTeamMember({
      name: name.trim(),
      email: email.trim(),
      role,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      phone: phone.trim() || undefined,
      calComLink: calComLink.trim() || undefined,
    });

    setName('');
    setEmail('');
    setPhone('');
    setCalComLink('');
    setIsInviteModalOpen(false);
  };

  const handleViewMemberLeads = (memberName: string) => {
    setFilters((prev) => ({ ...prev, assignedTo: memberName }));
    setCurrentView('all-leads');
  };

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-hidden bg-[var(--t-background-primary)] flex flex-col gap-2">
      {/* Twenty Style Compact Horizontal Toolbar */}
      <div className="p-2 sm:px-2.5 sm:py-1.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
          <div className="w-full sm:w-[220px]">
            <Input
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<IconSearch size={13} />}
              className="h-[26px] text-[12px] bg-[var(--t-background-primary)] w-full"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0">
            {['All', 'Admin', 'Closer', 'Caller', 'Developer'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`h-[24px] px-2 rounded-[4px] text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  roleFilter === r
                    ? 'bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] font-semibold shadow-2xs'
                    : 'text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Stats & Invite Button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-[11px] font-mono text-[var(--t-font-color-tertiary)]">
            {teamMembers.length} reps • {leads.length} leads
          </span>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<IconUserPlus size={13} />}
            onClick={() => setIsInviteModalOpen(true)}
            className="h-[26px] text-[11px]"
          >
            Invite Member
          </Button>
        </div>
      </div>

      {/* Twenty CRM Master Team Spreadsheet Table */}
      <div className="flex-1 overflow-auto border border-[var(--t-border-color-light)] rounded-[6px] bg-[var(--t-background-primary)]">
        <table className="w-full text-left text-[12px] border-collapse min-w-[860px]">
          <thead className="bg-[var(--t-background-secondary)] sticky top-0 z-10 border-b border-[var(--t-border-color-light)] text-[var(--t-font-color-tertiary)] text-[10.5px] font-medium uppercase tracking-wider">
            <tr>
              <th className="py-2 px-3 font-medium min-w-[200px]">Team Member</th>
              <th className="py-2 px-3 font-medium min-w-[140px]">Role & Permissions</th>
              <th className="py-2 px-3 font-medium min-w-[170px]">Live Activity Status</th>
              <th className="py-2 px-3 font-medium w-[110px] whitespace-nowrap">Assigned Leads</th>
              <th className="py-2 px-3 font-medium w-[130px] whitespace-nowrap">Deals Closed</th>
              <th className="py-2 px-3 font-medium min-w-[130px] whitespace-nowrap">Direct Line</th>
              <th className="py-2 px-3 font-medium w-[90px] whitespace-nowrap">Joined</th>
              <th className="py-2 px-3 font-medium text-right w-[80px] whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]">
            {filteredMembers.map((member) => {
              const assignedLeads = leads.filter((l) => l.leadOwner === member.name);
              const wonLeads = assignedLeads.filter((l) => l.status === 'Won');
              const wonValue = wonLeads.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);

              return (
                <tr
                  key={member.id}
                  className="hover:bg-[var(--t-background-transparent-light)] transition-colors group h-[40px] align-middle"
                >
                  {/* Member Name & Email */}
                  <td className="py-1.5 px-3 font-normal text-[var(--t-font-color-primary)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[28px] h-[28px] rounded-full overflow-hidden border border-[var(--t-border-color-light)] shrink-0 bg-[var(--t-background-secondary)]">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full bg-gradient-to-tr ${member.avatarColor} text-white flex items-center justify-center font-medium text-[10px]`}
                          >
                            {getInitials(member.name)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--t-font-color-primary)] truncate max-w-[180px]">
                          {member.name}
                        </div>
                        <div className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono truncate max-w-[180px]">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role Selector Badge */}
                  <td className="py-1.5 px-3">
                    <div className="max-w-[150px]">
                      <Dropdown
                        value={member.role}
                        onChange={(val) => updateTeamMember(member.id, { role: val as UserRole })}
                        options={roleOptions}
                        size="sm"
                        buttonClassName="h-[24px] text-[11px] font-medium bg-transparent border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-strong)]"
                      />
                    </div>
                  </td>

                  {/* Live Activity Status */}
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <div className="shrink-0">{getStatusIcon(member.activityStatus, member.activityIcon)}</div>
                      <div className="min-w-0">
                        <div className="text-[var(--t-font-color-primary)] font-medium truncate max-w-[160px]">
                          {member.activityStatus || 'Available / Online'}
                        </div>
                        {member.statusNote && (
                          <div className="text-[9.5px] text-[var(--t-font-color-tertiary)] truncate max-w-[160px]">
                            {member.statusNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Assigned Leads Count */}
                  <td className="py-1.5 px-3 font-mono text-[11.5px] whitespace-nowrap">
                    <button
                      onClick={() => handleViewMemberLeads(member.name)}
                      className="text-[var(--t-font-color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Click to view assigned leads"
                    >
                      <span>{assignedLeads.length} leads</span>
                    </button>
                  </td>

                  {/* Deals Closed */}
                  <td className="py-1.5 px-3 font-mono text-[11.5px] whitespace-nowrap">
                    {wonLeads.length > 0 ? (
                      <span className="text-emerald-500 font-medium">
                        {wonLeads.length} won ({formatCurrency(wonValue, currency)})
                      </span>
                    ) : (
                      <span className="text-[var(--t-font-color-tertiary)]">0 won</span>
                    )}
                  </td>

                  {/* Phone & Direct WhatsApp */}
                  <td className="py-1.5 px-3 text-[11px] text-[var(--t-font-color-tertiary)] font-mono whitespace-nowrap">
                    {member.phone ? (
                      <div className="flex items-center gap-1.5">
                        <span>{member.phone}</span>
                        <a
                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-0.5 text-emerald-400 hover:text-emerald-300"
                          title="WhatsApp Founder"
                        >
                          <IconBrandWhatsapp size={13} />
                        </a>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="py-1.5 px-3 text-[11px] text-[var(--t-font-color-tertiary)] font-mono whitespace-nowrap">
                    {formatDate(member.joinedAt, timezone)}
                  </td>

                  {/* Actions */}
                  <td className="py-1.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => deleteTeamMember(member.id)}
                        className="p-1 text-[var(--t-font-color-tertiary)] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Remove Team Member"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-center text-[var(--t-font-color-tertiary)]">
              <IconUsers size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-[13px] font-medium text-[var(--t-font-color-primary)]">
                No Team Members Added
              </h3>
              <p className="text-[11.5px] text-[var(--t-font-color-tertiary)] max-w-sm">
                Add your agency closers, cold outreach reps, and project managers to assign leads and track performance.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<IconUserPlus size={13} />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Add First Team Member
            </Button>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <Modal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          title="Invite / Add Team Member"
          subtitle="Add caller, closer, or developer to assign client leads and track performance"
          maxWidth="max-w-[460px]"
        >
          <form onSubmit={handleInviteSubmit} className="space-y-3 text-[12px]">
            <div>
              <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <Input
                required
                placeholder="e.g. Jordan Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-[28px] text-[12px]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <Input
                required
                type="email"
                placeholder="jordan@upgradeux.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[28px] text-[12px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                  Role & Permissions
                </label>
                <Dropdown
                  value={role}
                  onChange={(val) => setRole(val as UserRole)}
                  options={roleOptions}
                  size="sm"
                  buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-secondary)]"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                  Phone (Optional)
                </label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 019-3321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-[28px] text-[12px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--t-border-color-light)]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Add Team Member
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
