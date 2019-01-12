-- ----------------
-- for fire and gas alarm
-- ----------------
CREATE TABLE IF NOT EXISTS alarms (
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    occurrences varchar(32),
    msg varchar(32),
    sensor varchar(32),
    primary key (id)
);

insert into alarms (occurrences, msg, sensor) values ('2019-01-10 05:31:38', 'fire_alarm', 'F11');
insert into alarms (occurrences, msg, sensor) values ('2019-01-10 05:31:38', 'gas_alarm', 'L05');
insert into alarms (occurrences, msg, sensor) values ('2019-01-10 05:31:38', 'fire_recover', 'F11');
insert into alarms (occurrences, msg, sensor) values ('2019-01-10 05:31:38', 'gas_recover', 'L05');